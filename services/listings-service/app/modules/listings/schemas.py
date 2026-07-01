from datetime import datetime

from common.schemas import CamelModel
from pydantic import BaseModel, ConfigDict, Field


class ListingResponse(CamelModel):
    id: int
    source: str | None = None
    external_id: str | None = Field(None, alias="externalId")
    title: str | None = None
    description: str | None = None
    url: str
    price: int | None = None
    currency: str | None = None
    address: str | None = None
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    rooms: int | None = None
    area_total: float | None = Field(None, alias="areaTotal")
    area_living: float | None = Field(None, alias="areaLiving")
    area_kitchen: float | None = Field(None, alias="areaKitchen")
    floor: int | None = None
    floors_total: int | None = Field(None, alias="floorsTotal")
    published_at: datetime | None = Field(None, alias="publishedAt")
    contact_name: str | None = Field(None, alias="contactName")
    contact_phone: str | None = Field(None, alias="contactPhone")
    images: list[str] = Field(default_factory=list)
    source_author_name: str | None = Field(None, alias="sourceAuthorName")
    source_author_phone: str | None = Field(None, alias="sourceAuthorPhone")
    source_author_url: str | None = Field(None, alias="sourceAuthorUrl")
    source_posted_at: str | None = Field(None, alias="sourcePostedAt")
    source_parsed_at: datetime | None = Field(None, alias="sourceParsedAt")
    manual_overrides: list[str] = Field(default_factory=list, alias="manualOverrides")
    manual_note: str | None = Field(None, alias="manualNote")
    archived: bool = False
    created_at: datetime | None = Field(None, alias="createdAt")
    updated_at: datetime | None = Field(None, alias="updatedAt")


class ListingUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str | None = None
    description: str | None = None
    price: int | None = None
    currency: str | None = None
    address: str | None = None
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    rooms: int | None = None
    area_total: float | None = Field(None, alias="areaTotal")
    area_living: float | None = Field(None, alias="areaLiving")
    area_kitchen: float | None = Field(None, alias="areaKitchen")
    floor: int | None = None
    floors_total: int | None = Field(None, alias="floorsTotal")
    contact_name: str | None = Field(None, alias="contactName")
    contact_phone: str | None = Field(None, alias="contactPhone")
    manual_note: str | None = Field(None, alias="manualNote")
    archived: bool | None = None


class ListingImportItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    url: str
    source: str | None = None
    externalId: str | None = None
    title: str | None = None
    description: str | None = None
    price: str | int | float | None = None
    currency: str | None = None
    address: str | None = None
    city: str | None = None
    latitude: str | int | float | None = None
    longitude: str | int | float | None = None
    rooms: str | int | float | None = None
    areaTotal: str | int | float | None = None
    areaLiving: str | int | float | None = None
    areaKitchen: str | int | float | None = None
    floor: str | int | float | None = None
    floorsTotal: str | int | float | None = None
    publishedAt: str | None = None
    contactName: str | None = None
    contactPhone: str | None = None
    images: list[str] | None = None
    sourceAuthorName: str | None = None
    sourceAuthorPhone: str | None = None
    sourceAuthorUrl: str | None = None
    sourcePostedAt: str | None = None
    sourceParsedAt: str | None = None
    metadata: dict | None = None


class ListingImportPayload(BaseModel):
    listings: list[ListingImportItem] = Field(min_length=1)
    updateExisting: bool | None = Field(None, alias="updateExisting")


class ListingsListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[ListingResponse]
    total: int
    page: int
    pageSize: int = Field(..., alias="pageSize")
    hasMore: bool = Field(..., alias="hasMore")
    sources: list[str]
