-- 0007: las contraseñas pasan de Argon2id a PBKDF2-HMAC-SHA256 (Web Crypto nativo en el Worker).
--
-- Formato: $pbkdf2-sha256$i=<iteraciones>$<sal base64>$<hash base64>. Se mantiene el CHECK como red de
-- seguridad: un texto plano jamás se guarda. Se aceptan ambos formatos para no invalidar cuentas previas;
-- el Worker solo verifica PBKDF2, así que una cuenta con hash Argon2id debe restablecerse.

alter table public.accounts drop constraint accounts_password_hash_check;
alter table public.accounts add constraint accounts_password_hash_check
  check (
    password_hash ~ '^\$pbkdf2-sha256\$i=[0-9]{5,6}\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$'
    or password_hash ~ '^\$argon2id\$v=19\$m=[0-9]+,t=[0-9]+,p=[0-9]+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$'
  );
