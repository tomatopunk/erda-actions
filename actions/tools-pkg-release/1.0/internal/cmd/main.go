package main

import (
	"fmt"
	"github.com/erda-project/erda-actions/actions/tools-pkg-release/1.0/internal/config"
	"time"
)

func main() {
	fmt.Println(config.ErdaVersion())
	fmt.Println(config.RepoErdaTools())
	fmt.Println(config.RepoErdaRelease())
	fmt.Println(config.RepoVersion())

	for _, i := range make([]int, 10000) {
		fmt.Println(i)
		time.Sleep(time.Second * 3)
	}
}
