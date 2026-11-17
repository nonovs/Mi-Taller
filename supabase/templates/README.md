# Plantillas de email (pendientes)

Plantillas con código de acceso para invitar a clientes por email. El plan gratuito de Supabase
no deja editar plantillas sin un servidor de correo propio (SMTP). Cuando el taller lo tenga,
se declaran en `config.toml` (`[auth.email.template.invite]` con `content_path`) y se suben con
`npx supabase config push`.
