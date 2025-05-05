
package websocket

import (
	"testing"
)

func TestMaskBytes(t *testing.T) {
	tests := []struct {
		name string
		key  [4]byte
		pos  int
		b    []byte
		want int
	}{
		{
			name: "small buffer",
			key:  [4]byte{'a', 'b', 'c', 'd'},
			pos:  0,
			b:    []byte{1, 2, 3, 4, 5, 6},
			want: 2,
		},
		{
			name: "large buffer",
			key:  [4]byte{'a', 'b', 'c', 'd'},
			pos:  0,
			b:    make([]byte, 100),
			want: 0,
		},
		{
			name: "aligned word size key",
			key:  [4]byte{'a', 'b', 'c', 'd'},
			pos:  0,
			b:    make([]byte, 100),
			want: 0,
		},
		{
			name: "unaligned word size key",
			key:  [4]byte{'a', 'b', 'c', 'd'},
			pos:  0,
			b:    make([]byte, 100),
			want: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := maskBytes(tt.key, tt.pos, tt.b)
			if got!= tt.want {
				t.Errorf("maskBytes() = %d, want %d", got, tt.want)
			}
		})
	}
}
