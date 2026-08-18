package main

import "testing"

func TestAnalyzeText(t *testing.T) {
	got := AnalyzeText("Go makes small services useful. Go keeps the seam clear!\n\nShip the useful thing.")

	if got.Words != 14 {
		t.Fatalf("Words = %d, want 14", got.Words)
	}
	if got.Characters == 0 {
		t.Fatal("Characters should count the input runes")
	}
	if got.Sentences != 3 {
		t.Fatalf("Sentences = %d, want 3", got.Sentences)
	}
	if got.Paragraphs != 2 {
		t.Fatalf("Paragraphs = %d, want 2", got.Paragraphs)
	}
	if got.ReadingTimeMinutes != 1 {
		t.Fatalf("ReadingTimeMinutes = %d, want 1", got.ReadingTimeMinutes)
	}
	if len(got.FrequentWords) == 0 || got.FrequentWords[0] != (WordFrequency{Word: "go", Count: 2}) {
		t.Fatalf("FrequentWords = %#v, want go twice first", got.FrequentWords)
	}
}

func TestAnalyzeTextHandlesEmptyInput(t *testing.T) {
	got := AnalyzeText("   \n\n")

	if got.Words != 0 || got.Characters != 5 || got.Sentences != 0 || got.Paragraphs != 0 || got.ReadingTimeMinutes != 0 {
		t.Fatalf("empty analysis = %#v", got)
	}
	if len(got.FrequentWords) != 0 {
		t.Fatalf("FrequentWords = %#v, want empty", got.FrequentWords)
	}
}

func TestAnalyzeTextSupportsUnicodeWords(t *testing.T) {
	got := AnalyzeText("Luna привет luna")

	if got.Words != 3 {
		t.Fatalf("Words = %d, want 3", got.Words)
	}
	if got.FrequentWords[0] != (WordFrequency{Word: "luna", Count: 2}) {
		t.Fatalf("FrequentWords = %#v, want luna twice first", got.FrequentWords)
	}
}
