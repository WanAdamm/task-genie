import re
import unicodedata
import xml.etree.ElementTree as ElementTree
import zlib
from dataclasses import dataclass
from io import BytesIO
from pathlib import PurePath
from zipfile import BadZipFile, ZipFile, is_zipfile

from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
from pypdf import PdfReader
from pypdf.filters import ASCII85Decode, ASCIIHexDecode
from pypdf.generic import ArrayObject, DictionaryObject, IndirectObject, StreamObject

from models.assignment_plan import (
    DocumentExtractionResponse,
    ExtractedDocumentSummary,
    MAX_ASSIGNMENT_REQUIREMENTS_CHARS,
)


MAX_FILES = 5
MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_TOTAL_BYTES = 15 * 1024 * 1024
MAX_PDF_PAGES_PER_FILE = 50
MAX_PDF_PAGES_TOTAL = 100
MAX_PDF_CONTENT_STREAM_BYTES = 2 * 1024 * 1024
MAX_PDF_RESOURCE_BYTES = 8 * 1024 * 1024
MAX_PDF_OBJECTS = 20_000
MAX_DOCX_ENTRIES = 1000
MAX_DOCX_UNCOMPRESSED_BYTES = 25 * 1024 * 1024
MAX_DOCX_MEMBER_BYTES = 10 * 1024 * 1024
MAX_DOCX_COMPRESSION_RATIO = 100
READ_CHUNK_BYTES = 64 * 1024


class DocumentExtractionError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


@dataclass(frozen=True)
class UploadedDocument:
    name: str
    content_type: str | None
    data: bytes


def safe_filename(name: str | None) -> str:
    filename = (name or "document").replace("\\", "/").rsplit("/", 1)[-1]
    filename = "".join(
        character
        for character in filename
        if unicodedata.category(character) != "Cc"
    ).strip()
    filename = filename or "document"
    if len(filename) <= 120:
        return filename
    suffix = PurePath(filename).suffix
    if suffix.lower() not in {".pdf", ".docx", ".txt"}:
        suffix = ""
    return f"{filename[:120 - len(suffix)]}{suffix}"


def read_upload(stream, name: str, total_bytes: int) -> bytes:
    chunks: list[bytes] = []
    file_bytes = 0
    while chunk := stream.read(READ_CHUNK_BYTES):
        file_bytes += len(chunk)
        if file_bytes > MAX_FILE_BYTES:
            raise DocumentExtractionError(
                413,
                f"{name} exceeds the 5 MiB per-file limit.",
            )
        if total_bytes + file_bytes > MAX_TOTAL_BYTES:
            raise DocumentExtractionError(
                413,
                "The selected files exceed the 15 MiB combined limit.",
            )
        chunks.append(chunk)
    if file_bytes == 0:
        raise DocumentExtractionError(422, f"{name} is empty.")
    return b"".join(chunks)


def _normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFC", value.replace("\r\n", "\n").replace("\r", "\n"))
    value = "".join(
        character
        for character in value
        if character in {"\n", "\t"}
        or not unicodedata.category(character).startswith("C")
    )
    value = "\n".join(line.rstrip() for line in value.split("\n"))
    return re.sub(r"\n{3,}", "\n\n", value).strip()


def _ensure_text(value: str, name: str, max_characters: int) -> str:
    normalized = _normalize_text(value)
    if not normalized:
        raise DocumentExtractionError(
            422,
            f"{name} contains no extractable text. Scanned PDFs are not supported yet.",
        )
    if len(normalized) > max_characters:
        raise DocumentExtractionError(
            422,
            "The extracted brief exceeds the available 50,000-character limit. "
            "Remove a document or shorten the existing brief.",
        )
    return normalized


def _extract_pdf(
    document: UploadedDocument,
    max_characters: int,
    max_pages: int,
) -> tuple[str, int, list[str]]:
    if not document.data[:1024].lstrip().startswith(b"%PDF-"):
        raise DocumentExtractionError(415, f"{document.name} is not a valid PDF file.")
    try:
        reader = PdfReader(BytesIO(document.data), strict=False)
        if reader.is_encrypted:
            raise DocumentExtractionError(
                422,
                f"{document.name} is encrypted and cannot be read.",
            )
        page_count = len(reader.pages)
        if page_count > MAX_PDF_PAGES_PER_FILE:
            raise DocumentExtractionError(
                422,
                f"{document.name} exceeds the 50-page PDF limit.",
            )
        if page_count > max_pages:
            raise DocumentExtractionError(
                422,
                "The selected PDFs exceed the 100-page combined limit.",
            )
        parts: list[str] = []
        empty_pages = 0
        extracted_characters = 0
        validation_state = {
            "visited": set(),
            "objects": 0,
            "decoded_bytes": 0,
        }
        for page_number, page in enumerate(reader.pages, start=1):
            _validate_pdf_resources(page, document.name, validation_state)
            page_text = _normalize_text(page.extract_text() or "")
            if not page_text:
                empty_pages += 1
                continue
            section = f"[Page {page_number}]\n{page_text}"
            extracted_characters += len(section) + (2 if parts else 0)
            if extracted_characters > max_characters:
                raise DocumentExtractionError(
                    422,
                    "The extracted brief exceeds the available 50,000-character limit. "
                    "Remove a document or shorten the existing brief.",
                )
            parts.append(section)
    except DocumentExtractionError:
        raise
    except Exception as error:
        raise DocumentExtractionError(
            422,
            f"{document.name} could not be read as a PDF.",
        ) from error

    text = _ensure_text("\n\n".join(parts), document.name, max_characters)
    warnings = []
    if empty_pages:
        warnings.append(
            f"{empty_pages} PDF page{'s' if empty_pages != 1 else ''} contained no text."
        )
    return text, page_count, warnings


def _validate_pdf_resources(page, name: str, state: dict) -> None:
    def visit(value) -> None:
        if isinstance(value, IndirectObject):
            identity = ("indirect", value.idnum, value.generation)
            if identity in state["visited"]:
                return
            state["visited"].add(identity)
            value = value.get_object()
        elif isinstance(value, (ArrayObject, DictionaryObject)):
            identity = ("direct", id(value))
            if identity in state["visited"]:
                return
            state["visited"].add(identity)
        else:
            return

        state["objects"] += 1
        if state["objects"] > MAX_PDF_OBJECTS:
            raise DocumentExtractionError(
                422,
                f"{name} contains too many PDF objects to read safely.",
            )

        if isinstance(value, StreamObject):
            if str(value.get("/Subtype")) == "/Image":
                return
            raw_data = getattr(value, "_data", b"")
            if len(raw_data) > MAX_PDF_CONTENT_STREAM_BYTES:
                raise DocumentExtractionError(
                    422,
                    f"{name} contains a resource that is too complex to read safely.",
                )
            filters = value.get("/Filter")
            filter_names = (
                [str(item) for item in filters]
                if isinstance(filters, ArrayObject)
                else ([] if filters is None else [str(filters)])
            )
            decoded = raw_data
            for filter_name in filter_names:
                try:
                    if filter_name in {"/ASCII85Decode", "/A85"}:
                        decoded = ASCII85Decode.decode(decoded)
                    elif filter_name in {"/ASCIIHexDecode", "/AHx"}:
                        decoded = ASCIIHexDecode.decode(decoded)
                    elif filter_name in {"/FlateDecode", "/Fl"}:
                        decompressor = zlib.decompressobj()
                        decoded = decompressor.decompress(
                            decoded,
                            MAX_PDF_CONTENT_STREAM_BYTES + 1,
                        )
                        if decompressor.unconsumed_tail:
                            raise DocumentExtractionError(
                                422,
                                f"{name} contains a resource that is too complex to read safely.",
                            )
                    else:
                        raise DocumentExtractionError(
                            422,
                            f"{name} uses PDF compression that is not supported for safe extraction.",
                        )
                except DocumentExtractionError:
                    raise
                except (ValueError, zlib.error) as error:
                    raise DocumentExtractionError(
                        422,
                        f"{name} contains invalid PDF data.",
                    ) from error
                if len(decoded) > MAX_PDF_CONTENT_STREAM_BYTES:
                    raise DocumentExtractionError(
                        422,
                        f"{name} contains a resource that is too complex to read safely.",
                    )
            decoded_size = len(decoded)
            state["decoded_bytes"] += decoded_size
            if state["decoded_bytes"] > MAX_PDF_RESOURCE_BYTES:
                raise DocumentExtractionError(
                    422,
                    f"{name} contains too much decoded PDF data to read safely.",
                )

        if isinstance(value, DictionaryObject):
            for key, child in value.items():
                if str(key) not in {"/Parent", "/P", "/Pg"}:
                    visit(child)
        elif isinstance(value, ArrayObject):
            for child in value:
                visit(child)

    try:
        try:
            visit(page.raw_get("/Contents"))
        except KeyError:
            pass
        resources = page.get("/Resources")
        if resources is not None:
            visit(resources)
    except DocumentExtractionError:
        raise
    except Exception as error:
        raise DocumentExtractionError(422, f"{name} contains invalid PDF data.") from error


def _validate_docx_archive(document: UploadedDocument) -> list[str]:
    if not is_zipfile(BytesIO(document.data)):
        raise DocumentExtractionError(415, f"{document.name} is not a valid DOCX file.")
    try:
        with ZipFile(BytesIO(document.data)) as archive:
            entries = archive.infolist()
            names = {entry.filename for entry in entries}
            if "[Content_Types].xml" not in names or "word/document.xml" not in names:
                raise DocumentExtractionError(
                    415,
                    f"{document.name} is not a valid DOCX file.",
                )
            if len(entries) > MAX_DOCX_ENTRIES:
                raise DocumentExtractionError(422, f"{document.name} is too complex to read safely.")

            total_uncompressed = 0
            for entry in entries:
                if entry.flag_bits & 0x1:
                    raise DocumentExtractionError(422, f"{document.name} is encrypted.")
                if entry.file_size > MAX_DOCX_MEMBER_BYTES:
                    raise DocumentExtractionError(422, f"{document.name} is too complex to read safely.")
                total_uncompressed += entry.file_size
                if total_uncompressed > MAX_DOCX_UNCOMPRESSED_BYTES:
                    raise DocumentExtractionError(422, f"{document.name} is too complex to read safely.")
                if entry.file_size and entry.file_size / max(entry.compress_size, 1) > MAX_DOCX_COMPRESSION_RATIO:
                    raise DocumentExtractionError(422, f"{document.name} is too compressed to read safely.")
            try:
                document_xml = archive.read("word/document.xml")
                root = ElementTree.fromstring(document_xml)
            except (BadZipFile, ElementTree.ParseError) as error:
                raise DocumentExtractionError(422, f"{document.name} contains invalid document data.") from error

            word_namespace = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
            if sum(1 for _ in root.iter()) > 100_000:
                raise DocumentExtractionError(422, f"{document.name} is too complex to read safely.")
            if sum(1 for _ in root.iter(f"{word_namespace}tbl")) > 200:
                raise DocumentExtractionError(422, f"{document.name} has too many tables.")
            if sum(1 for _ in root.iter(f"{word_namespace}tr")) > 2_000:
                raise DocumentExtractionError(422, f"{document.name} has too many table rows.")
            if sum(1 for _ in root.iter(f"{word_namespace}tc")) > 10_000:
                raise DocumentExtractionError(422, f"{document.name} has too many table cells.")
            for span in root.iter(f"{word_namespace}gridSpan"):
                try:
                    span_value = int(span.attrib.get(f"{word_namespace}val", "1"))
                except ValueError as error:
                    raise DocumentExtractionError(422, f"{document.name} contains an invalid table.") from error
                if span_value > 50:
                    raise DocumentExtractionError(422, f"{document.name} contains a table that is too wide.")

            warnings: list[str] = []
            unsupported_parts = [
                name
                for name in names
                if name.startswith(("word/header", "word/footer"))
                or name
                in {
                    "word/footnotes.xml",
                    "word/endnotes.xml",
                    "word/comments.xml",
                }
            ]
            auxiliary_text_found = False
            for part_name in unsupported_parts:
                try:
                    part_root = ElementTree.fromstring(archive.read(part_name))
                except ElementTree.ParseError as error:
                    raise DocumentExtractionError(
                        422,
                        f"{document.name} contains invalid document data.",
                    ) from error
                if any(
                    element.tag == f"{word_namespace}t"
                    and bool((element.text or "").strip())
                    for element in part_root.iter()
                ):
                    auxiliary_text_found = True
                    break
            if auxiliary_text_found:
                warnings.append(
                    "Text in headers, footers, footnotes, endnotes, or comments was not included."
                )
            if any(
                element.tag in {
                    f"{word_namespace}txbxContent",
                    f"{word_namespace}ins",
                    f"{word_namespace}del",
                    f"{word_namespace}sdt",
                    f"{word_namespace}customXml",
                    f"{word_namespace}altChunk",
                }
                for element in root.iter()
            ):
                warnings.append(
                    "Text boxes, content controls, or tracked changes may not be fully represented."
                )
            if any(
                any(descendant is not table and descendant.tag == f"{word_namespace}tbl" for descendant in table.iter())
                for table in root.iter(f"{word_namespace}tbl")
            ):
                warnings.append("Nested tables may not be fully represented.")
            return warnings
    except DocumentExtractionError:
        raise
    except Exception as error:
        raise DocumentExtractionError(
            422,
            f"{document.name} could not be read as a DOCX file.",
        ) from error


def _extract_docx(
    document: UploadedDocument,
    max_characters: int,
) -> tuple[str, None, list[str]]:
    warnings = _validate_docx_archive(document)
    try:
        parsed = Document(BytesIO(document.data))
        parts: list[str] = []
        extracted_characters = 0
        for block in parsed.iter_inner_content():
            if isinstance(block, Paragraph):
                block_text = block.text
            elif isinstance(block, Table):
                rows: list[str] = []
                table_characters = 0
                for row in block._tbl.tr_lst:
                    cells: list[str] = []
                    for cell in row.tc_lst:
                        cell_parts: list[str] = []
                        cell_characters = 0
                        for element in cell.iter():
                            if element.tag != "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t":
                                continue
                            text = element.text or ""
                            if (
                                extracted_characters
                                + table_characters
                                + cell_characters
                                + len(text)
                                > max_characters
                            ):
                                raise DocumentExtractionError(
                                    422,
                                    "The extracted brief exceeds the available "
                                    "50,000-character limit. Remove a document or "
                                    "shorten the existing brief.",
                                )
                            cell_parts.append(text)
                            cell_characters += len(text)
                        cells.append(_normalize_text(" ".join(cell_parts)))
                    row_text = " | ".join(cells)
                    table_characters += len(row_text) + (1 if rows else 0)
                    if extracted_characters + table_characters > max_characters:
                        raise DocumentExtractionError(
                            422,
                            "The extracted brief exceeds the available 50,000-character "
                            "limit. Remove a document or shorten the existing brief.",
                        )
                    rows.append(row_text)
                block_text = "\n".join(row for row in rows if row.strip(" |"))
            else:
                continue
            block_text = _normalize_text(block_text)
            if not block_text:
                continue
            extracted_characters += len(block_text) + (2 if parts else 0)
            if extracted_characters > max_characters:
                raise DocumentExtractionError(
                    422,
                    "The extracted brief exceeds the available 50,000-character limit. "
                    "Remove a document or shorten the existing brief.",
                )
            parts.append(block_text)
    except DocumentExtractionError:
        raise
    except Exception as error:
        raise DocumentExtractionError(
            422,
            f"{document.name} could not be read as a DOCX file.",
        ) from error
    return _ensure_text("\n\n".join(parts), document.name, max_characters), None, warnings


def _extract_txt(
    document: UploadedDocument,
    max_characters: int,
) -> tuple[str, None, list[str]]:
    if document.data.startswith((b"\xff\xfe", b"\xfe\xff")):
        encoding = "utf-16"
    else:
        encoding = "utf-8-sig"
    try:
        text = document.data.decode(encoding)
    except UnicodeDecodeError as error:
        raise DocumentExtractionError(
            422,
            f"{document.name} must use UTF-8 or BOM-marked UTF-16 text.",
        ) from error
    if "\x00" in text:
        raise DocumentExtractionError(415, f"{document.name} appears to be a binary file.")
    return _ensure_text(text, document.name, max_characters), None, []


def extract_documents(
    documents: list[UploadedDocument],
    max_characters: int = MAX_ASSIGNMENT_REQUIREMENTS_CHARS,
) -> DocumentExtractionResponse:
    if not documents:
        raise DocumentExtractionError(400, "Select at least one document.")
    if len(documents) > MAX_FILES:
        raise DocumentExtractionError(400, "Select no more than five documents.")
    if not 1 <= max_characters <= MAX_ASSIGNMENT_REQUIREMENTS_CHARS:
        raise DocumentExtractionError(400, "The requested text limit is invalid.")

    combined_parts: list[str] = []
    summaries: list[ExtractedDocumentSummary] = []
    all_warnings: list[str] = []
    total_pdf_pages = 0

    for index, document in enumerate(documents, start=1):
        extension = PurePath(document.name).suffix.lower()
        document_type = {".pdf": "PDF", ".docx": "DOCX", ".txt": "TXT"}.get(extension)
        if document_type is None:
            raise DocumentExtractionError(
                415,
                f"{document.name} is not supported. Use PDF, DOCX, or TXT.",
            )

        heading = f"--- Document {index} ({document_type}) ---"
        used_characters = sum(len(part) for part in combined_parts) + 2 * len(combined_parts)
        remaining = max_characters - used_characters - len(heading) - 1
        if remaining < 1:
            raise DocumentExtractionError(
                422,
                "The extracted brief exceeds the available 50,000-character limit. "
                "Remove a document or shorten the existing brief.",
            )

        if document_type == "PDF":
            text, page_count, warnings = _extract_pdf(
                document,
                remaining,
                MAX_PDF_PAGES_TOTAL - total_pdf_pages,
            )
            total_pdf_pages += page_count
        elif document_type == "DOCX":
            text, page_count, warnings = _extract_docx(document, remaining)
        else:
            text, page_count, warnings = _extract_txt(document, remaining)

        if len(text) < 100:
            warnings.append("Very little text was found; review the extracted brief carefully.")
        combined_parts.append(f"{heading}\n{text}")
        summaries.append(
            ExtractedDocumentSummary(
                name=document.name,
                documentType=document_type,
                sizeBytes=len(document.data),
                characterCount=len(text),
                pageCount=page_count,
                warnings=warnings,
            )
        )
        all_warnings.extend(f"{document.name}: {warning}" for warning in warnings)

    combined = "\n\n".join(combined_parts)
    if len(combined) > max_characters:
        raise DocumentExtractionError(
            422,
            "The extracted brief exceeds the available 50,000-character limit. "
            "Remove a document or shorten the existing brief.",
        )
    return DocumentExtractionResponse(
        text=combined,
        characterCount=len(combined),
        files=summaries,
        warnings=all_warnings,
    )
