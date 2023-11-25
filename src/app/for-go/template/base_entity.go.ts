export const source = `
package entity

import (
	"context"
	"log"
	"time"
)

type BaseEntity interface {
	BeforeInsert(ctx context.Context) error
	BeforeUpdate(ctx context.Context) error
}

type baseEntity struct {
	TsIns time.Time
	TsUpt time.Time
}

func (obj *baseEntity) BeforeInsert(ctx context.Context) error {
	obj.TsIns = time.Now()
	obj.TsUpt = time.Now()
	log.Println("INS: %s", obj.TsIns)
	return nil
}
func (obj *baseEntity) BeforeUpdate(ctx context.Context) error {
	obj.TsUpt = time.Now()
	log.Println("UPD: %s", obj.TsIns)
	return nil
}

`;
export default source.trim();
