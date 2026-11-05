-- Pruebas de RLS y permisos para la migración 0001.
--
-- Ejecutar contra un proyecto o instancia local de Supabase donde existan los roles anon,
-- authenticated y service_role (no existen en un PostgreSQL vacío). Cada bloque lanza una
-- excepción si el resultado no es el esperado; si todo pasa, el script termina sin error.
-- La transacción se revierte al final: no deja datos.

begin;

-- 1. anon no puede insertar likes.
do $$
begin
  set local role anon;
  begin
    insert into public.likes (project_slug, visitor_hash)
    values ('prueba', repeat('a', 64));
    raise exception 'FALLO: anon pudo insertar en likes';
  exception when insufficient_privilege then
    null;
  end;
  reset role;
end $$;

-- 2. anon no puede leer likes directamente (ni siquiera los hashes).
do $$
begin
  set local role anon;
  begin
    perform 1 from public.likes;
    raise exception 'FALLO: anon pudo leer likes';
  exception when insufficient_privilege then
    null;
  end;
  reset role;
end $$;

-- 3. anon no puede modificar ni borrar likes.
do $$
begin
  set local role anon;
  begin
    update public.likes set visitor_hash = visitor_hash;
    raise exception 'FALLO: anon pudo actualizar likes';
  exception when insufficient_privilege then
    null;
  end;
  begin
    delete from public.likes;
    raise exception 'FALLO: anon pudo borrar likes';
  exception when insufficient_privilege then
    null;
  end;
  reset role;
end $$;

-- 4. anon no puede leer ni escribir el límite de frecuencia.
do $$
begin
  set local role anon;
  begin
    perform 1 from public.rate_limit_hits;
    raise exception 'FALLO: anon pudo leer rate_limit_hits';
  exception when insufficient_privilege then
    null;
  end;
  reset role;
end $$;

-- 5. anon no puede ejecutar la función de límite de frecuencia.
do $$
begin
  set local role anon;
  begin
    perform public.consume_rate_limit('prueba', 1, 60);
    raise exception 'FALLO: anon pudo ejecutar consume_rate_limit';
  exception when insufficient_privilege then
    null;
  end;
  reset role;
end $$;

-- 6. anon sí puede leer el ranking y los contadores (solo agregados).
do $$
declare
  v_count integer;
begin
  set local role anon;
  select public.get_like_count('inexistente') into v_count;
  if v_count <> 0 then
    raise exception 'FALLO: contador inesperado para proyecto sin likes';
  end if;
  perform * from public.get_project_rankings();
  reset role;
end $$;

-- 7. service_role inserta, cuenta y limita (camino que usa el Worker).
do $$
declare
  v_allowed boolean;
  v_count integer;
begin
  set local role service_role;
  insert into public.likes (project_slug, visitor_hash)
  values ('prueba', repeat('b', 64));
  select public.get_like_count('prueba') into v_count;
  if v_count <> 1 then
    raise exception 'FALLO: contador de service_role incorrecto (%)', v_count;
  end if;

  -- El mismo visitante no puede duplicar su like.
  begin
    insert into public.likes (project_slug, visitor_hash)
    values ('prueba', repeat('b', 64));
    raise exception 'FALLO: se duplicó un like del mismo visitante';
  exception when unique_violation then
    null;
  end;

  select public.consume_rate_limit('rls-test', 2, 60) into v_allowed;
  if v_allowed is not true then raise exception 'FALLO: primer uso debería estar permitido'; end if;
  select public.consume_rate_limit('rls-test', 2, 60) into v_allowed;
  if v_allowed is not true then raise exception 'FALLO: segundo uso debería estar permitido'; end if;
  select public.consume_rate_limit('rls-test', 2, 60) into v_allowed;
  if v_allowed is not false then raise exception 'FALLO: el tercer uso debería rechazarse'; end if;
  reset role;
end $$;

-- 8. Restricciones de integridad: formato del slug y del hash.
do $$
begin
  begin
    insert into public.likes (project_slug, visitor_hash)
    values ('../etc', repeat('c', 64));
    raise exception 'FALLO: se aceptó un slug con caracteres no válidos';
  exception when check_violation then
    null;
  end;
  begin
    insert into public.likes (project_slug, visitor_hash)
    values ('valido', 'no-es-hash');
    raise exception 'FALLO: se aceptó un hash con formato incorrecto';
  exception when check_violation then
    null;
  end;
end $$;

rollback;
