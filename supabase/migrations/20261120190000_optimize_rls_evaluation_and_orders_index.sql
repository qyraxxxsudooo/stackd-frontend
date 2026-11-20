-- Keep the current RLS policy semantics while evaluating stable auth helpers once per statement.
DO $$
DECLARE
  policy_row record;
  role_sql text;
  using_expr text;
  check_expr text;
  create_sql text;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND (
        coalesce(qual, '') ~* 'auth\.(uid|jwt|role)\(\)'
        OR coalesce(with_check, '') ~* 'auth\.(uid|jwt|role)\(\)'
      )
  LOOP
    using_expr := policy_row.qual;
    check_expr := policy_row.with_check;

    IF using_expr IS NOT NULL THEN
      using_expr := replace(using_expr, 'auth.uid()', '(select auth.uid())');
      using_expr := replace(using_expr, 'auth.jwt()', '(select auth.jwt())');
      using_expr := replace(using_expr, 'auth.role()', '(select auth.role())');
    END IF;

    IF check_expr IS NOT NULL THEN
      check_expr := replace(check_expr, 'auth.uid()', '(select auth.uid())');
      check_expr := replace(check_expr, 'auth.jwt()', '(select auth.jwt())');
      check_expr := replace(check_expr, 'auth.role()', '(select auth.role())');
    END IF;

    SELECT string_agg(
      CASE WHEN lower(role_name) = 'public' THEN 'PUBLIC' ELSE format('%I', role_name) END,
      ', ' ORDER BY ordinal
    )
    INTO role_sql
    FROM unnest(policy_row.roles) WITH ORDINALITY AS role_list(role_name, ordinal);

    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
      policy_row.policyname, policy_row.schemaname, policy_row.tablename
    );

    create_sql := format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      policy_row.policyname, policy_row.schemaname, policy_row.tablename,
      upper(policy_row.permissive), upper(policy_row.cmd), role_sql
    );

    IF using_expr IS NOT NULL THEN
      create_sql := create_sql || ' USING (' || using_expr || ')';
    END IF;
    IF check_expr IS NOT NULL THEN
      create_sql := create_sql || ' WITH CHECK (' || check_expr || ')';
    END IF;

    EXECUTE create_sql;
  END LOOP;
END
$$;

-- Orders are commonly fetched by user_id; this also supports FK checks on parent updates/deletes.
CREATE INDEX IF NOT EXISTS orders_user_id_idx
ON public.orders USING btree (user_id);