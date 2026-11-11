import * as LocalAuthentication from 'expo-local-authentication';

// Retorna true se o aparelho tem digital/Face ID e a pessoa já cadastrou no celular.
export async function biometriaDisponivel() {
  try {
    const temHardware = await LocalAuthentication.hasHardwareAsync();
    const cadastrada = await LocalAuthentication.isEnrolledAsync();
    return temHardware && cadastrada;
  } catch (erro) {
    console.log('Erro ao checar biometria:', erro);
    return false;
  }
}

// Abre a janela do sistema pedindo digital ou Face ID.
// Se a biometria falhar, o próprio sistema oferece a senha do aparelho.
export async function autenticar(motivo) {
  try {
    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: motivo || 'Confirme sua identidade',
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar senha do aparelho',
    });
    return resultado.success === true;
  } catch (erro) {
    console.log('Erro na autenticação:', erro);
    return false;
  }
}
