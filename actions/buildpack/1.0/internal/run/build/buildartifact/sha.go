package buildartifact

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"

	"github.com/pkg/errors"

	"github.com/erda-project/erda-actions/actions/buildpack/1.0/internal/run/conf"
	"github.com/erda-project/erda-actions/actions/buildpack/1.0/internal/run/util"
	"github.com/erda-project/erda-actions/actions/buildpack/1.0/internal/run/util/hashdir"
)

type (
	bpInfo struct {
		Repo string   `json:",omitempty"`
		Ver  string   `json:",omitempty"`
		Args []string // sorted map by key to []string
	}
	gitInfo struct {
		Repo       string
		Context    string
		ContextSHA string
	}
	clusterInfo struct {
		Name string
	}
	moduleInfo struct {
		Name        string
		Path        string
		CustomImage string `json:",omitempty"`
	}

	ArtifactLocation struct {
		BpInfo      bpInfo
		GitInfo     gitInfo
		ClusterInfo clusterInfo
		Modules     []moduleInfo
	}
)

/*
	ci artifact
	   如何计算 sha: bp-info + gittar-info + cluster-info
	   bp-info = bp-repo + bp-ver(or bp-commit) + bp-args // bp 与 code 不同，bp 使用同一分支，即使 commit 号变动，仍然认为镜像可以复用；需要支持强制打包
	   gittar-info = repo + context-sha // 无需 commit，而是使用 context-sha 进行标识
	   cluster-info = cluster-id

	return: artifactSHA, identityText, error
*/
func CalculateArtifactSHA() (string, string, error) {
	gitCtxSHA, err := hashdir.Create(conf.Params().Context, hashdir.SHA256, []string{".git/"})
	if err != nil {
		return "", "", err
	}
	if gitCtxSHA == fmt.Sprintf("%x", sha256.New().Sum(nil)) {
		return "", "", errors.Errorf("there is no file under context: %s", conf.EasyUse().RelativeCodeContext)
	}
	location := ArtifactLocation{
		BpInfo: bpInfo{
			Args: util.GetSortedKeySlice(conf.Params().BpArgs),
		},
		GitInfo: gitInfo{
			Repo:       conf.PlatformEnvs().ProjectAppAbbr,
			Context:    conf.EasyUse().RelativeCodeContext,
			ContextSHA: gitCtxSHA,
		},
		ClusterInfo: clusterInfo{
			Name: conf.PlatformEnvs().ClusterName,
		},
	}
	var modules []moduleInfo
	for _, m := range conf.Params().Modules {
		n := moduleInfo{
			Name: m.Name,
			Path: m.Path,
		}
		if !m.Image.AutoGenerated {
			n.CustomImage = m.Image.Name
		}
		modules = append(modules, n)
	}
	location.Modules = modules

	locationByte, _ := json.MarshalIndent(&location, "", "  ")
	artifactshaArray := sha256.Sum256(locationByte)
	artifactSHA := hex.EncodeToString(artifactshaArray[:])
	return artifactSHA, string(locationByte), nil
}