package serialize

import (
	"encoding/base64"
	"encoding/json"

	"spine/internal/model"
)

// Encode marshals the tree to base64(JSON) for the URL hash.
func Encode(root *model.Node) (string, error) {
	b, err := json.Marshal(root)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// Decode restores a tree from a base64(JSON) string.
func Decode(s string) (*model.Node, error) {
	b, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil {
		return nil, err
	}
	var root model.Node
	if err := json.Unmarshal(b, &root); err != nil {
		return nil, err
	}
	return &root, nil
}
