package main

import (
	"sort"
	"strings"
	"unicode"
	"unicode/utf8"
)

type Analysis struct {
	Words              int             `json:"words"`
	Characters         int             `json:"characters"`
	Sentences          int             `json:"sentences"`
	Paragraphs         int             `json:"paragraphs"`
	ReadingTimeMinutes int             `json:"readingTimeMinutes"`
	FrequentWords      []WordFrequency `json:"frequentWords"`
}

type WordFrequency struct {
	Word  string `json:"word"`
	Count int    `json:"count"`
}

// AnalyzeText is the deep module at the Text Lens seam. It owns the text rules;
// callers only need to provide text and consume the resulting reading insights.
func AnalyzeText(text string) Analysis {
	words := extractWords(text)

	return Analysis{
		Words:              len(words),
		Characters:         utf8.RuneCountInString(text),
		Sentences:          countSentences(text, len(words)),
		Paragraphs:         countParagraphs(text),
		ReadingTimeMinutes: readingTime(len(words)),
		FrequentWords:      frequentWords(words),
	}
}

func extractWords(text string) []string {
	lowercase := strings.ToLower(text)
	return strings.FieldsFunc(lowercase, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsDigit(r)
	})
}

func countSentences(text string, wordCount int) int {
	count := 0
	terminator := false

	for _, r := range text {
		if strings.ContainsRune(".!?", r) {
			if !terminator {
				count++
			}
			terminator = true
			continue
		}

		if !unicode.IsSpace(r) {
			terminator = false
		}
	}

	if count == 0 && wordCount > 0 {
		return 1
	}
	return count
}

func countParagraphs(text string) int {
	paragraphs := 0
	insideParagraph := false

	for _, line := range strings.Split(text, "\n") {
		if strings.TrimSpace(line) == "" {
			insideParagraph = false
			continue
		}
		if !insideParagraph {
			paragraphs++
			insideParagraph = true
		}
	}

	return paragraphs
}

func readingTime(wordCount int) int {
	if wordCount == 0 {
		return 0
	}
	return (wordCount + 199) / 200
}

func frequentWords(words []string) []WordFrequency {
	counts := make(map[string]int)
	for _, word := range words {
		counts[word]++
	}

	frequencies := make([]WordFrequency, 0, len(counts))
	for word, count := range counts {
		frequencies = append(frequencies, WordFrequency{Word: word, Count: count})
	}

	sort.Slice(frequencies, func(i, j int) bool {
		if frequencies[i].Count == frequencies[j].Count {
			return frequencies[i].Word < frequencies[j].Word
		}
		return frequencies[i].Count > frequencies[j].Count
	})

	if len(frequencies) > 5 {
		frequencies = frequencies[:5]
	}
	return frequencies
}
