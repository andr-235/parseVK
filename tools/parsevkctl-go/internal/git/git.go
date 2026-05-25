package git

import "context"

type Adapter interface {
	CurrentBranch(ctx context.Context) (string, error)
	DefaultBranch(ctx context.Context) (string, error)
	IsWorkTreeClean(ctx context.Context) (bool, []string, error)
	LocalBranchExists(ctx context.Context, branch string) (bool, error)
	RemoteBranchExists(ctx context.Context, remote string, branch string) (bool, error)
	Fetch(ctx context.Context, remote string, branch string) error
	Switch(ctx context.Context, branch string) error
	PullFFOnly(ctx context.Context, remote string, branch string) error
	CreateBranch(ctx context.Context, branch string) error
	DeleteLocalBranch(ctx context.Context, branch string, force bool) error
	DeleteRemoteBranch(ctx context.Context, remote string, branch string) error
	PushBranch(ctx context.Context, remote string, branch string, setUpstream bool) error
	HasCommitsAhead(ctx context.Context, base string, head string) (bool, error)
}
