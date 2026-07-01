from common.schemas import CamelModel


def test_camelmodel_accepts_snake_case_and_camel_case():
    class Model(CamelModel):
        first_name: str
        last_name: str

    by_alias = Model(firstName="John", lastName="Doe")
    assert by_alias.first_name == "John"
    assert by_alias.last_name == "Doe"

    by_name = Model(first_name="Jane", last_name="Smith")
    assert by_name.first_name == "Jane"
    assert by_name.last_name == "Smith"


def test_camelmodel_from_attributes():
    class Model(CamelModel):
        name: str
        value: int

    obj = type("Obj", (), {"name": "test", "value": 42})()
    instance = Model.model_validate(obj)
    assert instance.name == "test"
    assert instance.value == 42


def test_camelmodel_serializes_to_camel_case():
    class Model(CamelModel):
        first_name: str
        last_name: str

    instance = Model(first_name="Alice", last_name="Wonder")
    dumped = instance.model_dump(by_alias=True)
    assert dumped == {"firstName": "Alice", "lastName": "Wonder"}
