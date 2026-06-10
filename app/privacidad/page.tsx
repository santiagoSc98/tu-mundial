export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#0B132B] py-12 px-6">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center gap-3 mb-8">
          <img src="/logo-mundial.png" alt="TU MUNDIAL" className="w-10 h-10" />
          <div>
            <h1 className="text-2xl font-bold text-white">TU MUNDIAL</h1>
            <p className="text-sm text-gray-400">Tus Predicciones</p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">
          Política de Privacidad
        </h2>
        <p className="text-gray-400 mb-8">
          Última actualización: junio 2026
        </p>

        <div className="space-y-8 text-gray-300">

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">
              1. Información que recopilamos
            </h3>
            <p>Al usar TU MUNDIAL, recopilamos:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Nombre y correo electrónico de tu cuenta de Google</li>
              <li>Foto de perfil de tu cuenta de Google</li>
              <li>Tus predicciones de partidos</li>
              <li>Tu actividad dentro de la plataforma</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">
              2. Cómo usamos tu información
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Para crear y gestionar tu cuenta</li>
              <li>Para mostrar tu posición en los rankings</li>
              <li>Para calcular tus puntos y estadísticas</li>
              <li>Para mostrarte anuncios relevantes (Google AdSense)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">
              3. Google AdSense
            </h3>
            <p>
              Utilizamos Google AdSense para mostrar anuncios.
              Google puede usar cookies para mostrar anuncios
              basados en tus visitas anteriores a este sitio y
              otros sitios web. Podés desactivar la publicidad
              personalizada en{' '}
              <a
                href="https://www.google.com/settings/ads"
                className="text-[#006A33] underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Configuración de anuncios de Google
              </a>.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">
              4. Cookies
            </h3>
            <p>
              Usamos cookies para mantener tu sesión iniciada y
              para el funcionamiento de Google AdSense. Al usar
              la plataforma, aceptás el uso de cookies.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">
              5. Compartir información
            </h3>
            <p>
              No vendemos ni compartimos tu información personal
              con terceros, excepto con Google para el funcionamiento
              de AdSense y la autenticación con Google OAuth.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">
              6. Tus derechos
            </h3>
            <p>Podés:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Solicitar la eliminación de tu cuenta y datos</li>
              <li>Acceder a tu información personal</li>
              <li>Cerrar sesión en cualquier momento</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">
              7. Contacto
            </h3>
            <p>
              Para consultas sobre privacidad escribinos a:{' '}
              <span className="text-[#006A33]">
                santiagocampuzano68@gmail.com
              </span>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <a href="/" className="text-[#006A33] hover:underline">
            ← Volver a TU MUNDIAL
          </a>
        </div>

      </div>
    </div>
  )
}
