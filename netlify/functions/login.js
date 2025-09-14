
// Esta es nuestra primera función "serverless", que manejará los inicios de sesión.

exports.handler = async function(event, context) {
  // 1. Extraer los datos que envía la aplicación.
  // El email y la contraseña del usuario vendrán en el "body" de la petición.
  const { email, password } = JSON.parse(event.body);

  // 2. Lógica de validación (por ahora, un usuario de prueba).
  // En el futuro, reemplazaremos esto con una búsqueda en una base de datos real.
  const emailDePrueba = "test@example.com";
  const passwordDePrueba = "password123";

  if (email === emailDePrueba && password === passwordDePrueba) {
    // 3. Si el inicio de sesión es exitoso.
    return {
      statusCode: 200, // Código de éxito
      body: JSON.stringify({
        message: "¡Inicio de sesión exitoso!",
        // En una aplicación real, aquí devolveríamos un "token" de seguridad.
      }),
    };
  } else {
    // 4. Si el inicio de sesión falla.
    return {
      statusCode: 401, // Código de "No autorizado"
      body: JSON.stringify({ message: "Email o contraseña inválidos." }),
    };
  }
};
