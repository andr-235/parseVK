from dataclasses import dataclass


@dataclass
class IngestionResult:
    groups: int = 0
    posts: int = 0
    comments: int = 0
    authors: int = 0
    errors: list[dict] | None = None

    def stats(self) -> dict[str, int]:
        return {
            "groups": self.groups,
            "posts": self.posts,
            "comments": self.comments,
            "authors": self.authors,
            "errors": len(self.errors) if self.errors else 0,
        }

    @property
    def processed_items(self) -> int:
        return self.groups + self.posts + self.comments
