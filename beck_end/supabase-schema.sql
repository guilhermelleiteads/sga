-- As tabelas da aplicação são relacionais e devem ser criadas pelo
-- Banco_de_dados/schema-relacional.sql.
-- A service role key deve ficar somente no backend, nunca no frontend.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;