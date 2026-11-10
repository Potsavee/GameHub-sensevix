package auth

import (
	"strings"
	"testing"
	"time"
)

func TestIssueAndParse(t *testing.T) {
	issuer := &Issuer{Secret: []byte("a secret key with at least 32 bytes long"), TTL: time.Hour}
	token, err := issuer.Issue(42, "member")
	if err != nil {
		t.Fatal(err)
	}

	id, role, err := issuer.Parse(token)
	if err != nil {
		t.Fatal(err)
	}
	if id != 42 || role != "member" {
		t.Fatalf("Parse() = (%d, %q), want (42, %q)", id, role, "member")
	}
}

func TestParseRejectsTamperedToken(t *testing.T) {
	issuer := &Issuer{Secret: []byte("a secret key with at least 32 bytes long"), TTL: time.Hour}
	token, err := issuer.Issue(42, "member")
	if err != nil {
		t.Fatal(err)
	}
	signatureStart := strings.LastIndexByte(token, '.') + 1
	replacement := byte('x')
	if token[signatureStart] == replacement {
		replacement = 'y'
	}
	tampered := token[:signatureStart] + string(replacement) + token[signatureStart+1:]
	if _, _, err := issuer.Parse(tampered); err == nil {
		t.Fatal("Parse() accepted a tampered token")
	}
}

func TestParseRejectsExpiredToken(t *testing.T) {
	issuer := &Issuer{Secret: []byte("a secret key with at least 32 bytes long"), TTL: -time.Second}
	token, err := issuer.Issue(42, "member")
	if err != nil {
		t.Fatal(err)
	}
	if _, _, err := issuer.Parse(token); err == nil {
		t.Fatal("Parse() accepted an expired token")
	}
}
