from app.modules.listings.csv_export import (
    build_csv_filename,
    format_csv_header,
    format_csv_row,
    parse_csv_fields,
)


async def export_listings_csv(
    repository,
    *,
    search: str | None,
    source: str | None,
    archived: bool | None,
    all: bool,
    fields: str | None,
    to_dto,
) -> tuple[str, str]:
    resolved_search = None if all else search
    resolved_source = None if all else source
    resolved_archived = None if all else archived
    rows = await repository.find_for_export(
        search=resolved_search,
        source=resolved_source,
        archived=resolved_archived,
    )
    selected = parse_csv_fields(fields)
    lines = [format_csv_header(selected)]
    lines.extend(
        format_csv_row(to_dto(row).model_dump(by_alias=True), selected)
        for row in rows
    )
    return "\ufeff" + "\n".join(lines) + "\n", build_csv_filename(
        source=resolved_source, export_all=all
    )
