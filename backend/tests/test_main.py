from backend import main


def test_main_entrypoint_is_callable() -> None:
    assert callable(main)
