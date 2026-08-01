from uuid import UUID, NAMESPACE_URL, uuid5

SourceKey = tuple[str, str, str]


def source_key(provider: str, source_type: str, external_id: str) -> SourceKey:
    return provider, source_type, str(int(external_id))


def stable_source_id(key: SourceKey) -> UUID:
    provider, source_type, external_id = key
    return uuid5(NAMESPACE_URL, f"parsevk:{provider}:{source_type}:{external_id}")
