-- Gateway admin audit log for one_leave identity management.
-- Records every privileged user/role/employee mutation performed from the
-- gateway admin section (/admin/*). Lives in the one_leave schema because the
-- gateway is the identity hub that owns one_leave.users / user_roles / employees.

CREATE TABLE IF NOT EXISTS one_leave.user_admin_audit (
	id BIGSERIAL PRIMARY KEY,
	actor_user_id BIGINT,
	actor_username TEXT,
	action TEXT NOT NULL,
	target_user_id BIGINT,
	detail JSONB,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_user_admin_audit_target
	ON one_leave.user_admin_audit (target_user_id);

CREATE INDEX IF NOT EXISTS ix_user_admin_audit_created
	ON one_leave.user_admin_audit (created_at DESC);
