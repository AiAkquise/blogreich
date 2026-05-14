"""Tests for style pipeline integration — _build_style_context + build_style_system_prompt."""

from app.blogs.prompts import (
    OUTLINE_SYSTEM_PROMPT,
    build_style_system_prompt,
)
from app.blogs.service import _build_style_context

# --- _build_style_context tests ---


class TestBuildStyleContext:
    """Tests for the _build_style_context helper function."""

    def test_full_structured_data(self) -> None:
        """All structured fields are formatted into readable string."""
        style_profile = {
            "text": "Fallback text",
            "data": {
                "summary": "Professionell und nahbar",
                "tonality": "freundlich-kompetent",
                "formality_level": "semi-formal",
                "address_form": "du",
                "sentence_style": "Kurze, praegnante Saetze",
                "vocabulary": ["SEO", "Content-Marketing", "Leadgenerierung"],
                "brand_values": ["Innovation", "Transparenz"],
                "content_themes": ["Digitalisierung", "KI"],
                "writing_guidelines": "Immer mit konkreten Beispielen arbeiten.",
            },
        }
        result = _build_style_context(style_profile)

        assert "Professionell und nahbar" in result
        assert "freundlich-kompetent" in result
        assert "semi-formal" in result
        assert "Du-Ansprache" in result
        assert "Kurze, praegnante Saetze" in result
        assert "SEO" in result
        assert "Content-Marketing" in result
        assert "Innovation" in result
        assert "Digitalisierung" in result
        assert "Immer mit konkreten Beispielen" in result

    def test_fallback_to_text(self) -> None:
        """Falls back to text when data is missing."""
        style_profile = {
            "text": "Der Stil ist locker und modern.",
        }
        result = _build_style_context(style_profile)
        assert result == "Der Stil ist locker und modern."

    def test_fallback_to_text_when_data_empty(self) -> None:
        """Falls back to text when data dict is empty."""
        style_profile = {
            "text": "Fallback text",
            "data": {},
        }
        result = _build_style_context(style_profile)
        assert result == "Fallback text"

    def test_empty_profile(self) -> None:
        """Returns empty string when both text and data are missing."""
        result = _build_style_context({})
        assert result == ""

    def test_address_form_sie(self) -> None:
        """Sie-Ansprache is correctly labeled."""
        style_profile = {
            "text": "",
            "data": {"address_form": "Sie"},
        }
        result = _build_style_context(style_profile)
        assert "Sie-Ansprache" in result

    def test_address_form_unknown(self) -> None:
        """Unknown address form is passed through as-is."""
        style_profile = {
            "text": "",
            "data": {"address_form": "mixed"},
        }
        result = _build_style_context(style_profile)
        assert "mixed" in result

    def test_vocabulary_not_list(self) -> None:
        """Non-list vocabulary is skipped gracefully."""
        style_profile = {
            "text": "",
            "data": {"vocabulary": "just a string"},
        }
        result = _build_style_context(style_profile)
        assert "Fachvokabular" not in result

    def test_empty_lists_skipped(self) -> None:
        """Empty lists don't produce output lines."""
        style_profile = {
            "text": "",
            "data": {
                "vocabulary": [],
                "brand_values": [],
                "content_themes": [],
            },
        }
        result = _build_style_context(style_profile)
        assert result == ""

    def test_partial_data(self) -> None:
        """Only present fields are included."""
        style_profile = {
            "text": "",
            "data": {
                "tonality": "sachlich",
                "brand_values": ["Qualitaet"],
            },
        }
        result = _build_style_context(style_profile)
        assert "sachlich" in result
        assert "Qualitaet" in result
        assert "Formalitaetsgrad" not in result


# --- build_style_system_prompt tests ---


class TestBuildStyleSystemPrompt:
    """Tests for the build_style_system_prompt function."""

    def test_with_style_context(self) -> None:
        """Style context is appended with instruction wrapper."""
        result = build_style_system_prompt("Base prompt.", "Tonalitaet: freundlich")
        assert result.startswith("Base prompt.")
        assert "UNTERNEHMENS-SCHREIBSTIL" in result
        assert "Tonalitaet: freundlich" in result
        assert "konsequent" in result

    def test_without_style_context_none(self) -> None:
        """Returns base prompt unchanged when style_context is None."""
        result = build_style_system_prompt("Base prompt.", None)
        assert result == "Base prompt."

    def test_without_style_context_empty(self) -> None:
        """Returns base prompt unchanged when style_context is empty string."""
        result = build_style_system_prompt("Base prompt.", "")
        assert result == "Base prompt."

    def test_with_real_system_prompt(self) -> None:
        """Works with actual OUTLINE_SYSTEM_PROMPT."""
        result = build_style_system_prompt(
            OUTLINE_SYSTEM_PROMPT, "Zusammenfassung: Formell"
        )
        assert "SEO-Blog-Stratege" in result
        assert "UNTERNEHMENS-SCHREIBSTIL" in result
        assert "Zusammenfassung: Formell" in result

    def test_no_style_duplication(self) -> None:
        """Style appears exactly once in the output."""
        style = "Tonalitaet: locker"
        result = build_style_system_prompt("Base.", style)
        assert result.count(style) == 1
