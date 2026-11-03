// ===== GERADOR DE CÓDIGO PIX (padrão "copia e cola" do Banco Central) =====

// Tira acentos e deixa maiúsculo (o Pix não aceita acentos no nome/cidade)
function semAcento(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

// Monta um campo no formato: ID + tamanho (2 dígitos) + valor
function campoPix(id, valor) {
  return id + String(valor.length).padStart(2, "0") + valor;
}

// Cálculo do CRC16 (código de verificação exigido pelo Pix)
function crc16(texto) {
  let crc = 0xFFFF;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      else crc = (crc << 1) & 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Gera o texto que vira QR Code
function gerarPix(chave, nome, cidade, valor, idPedido) {
  const conta = campoPix("00", "br.gov.bcb.pix") + campoPix("01", chave);

  const codigo =
    campoPix("00", "01") +
    campoPix("26", conta) +
    campoPix("52", "0000") +
    campoPix("53", "986") +                         // 986 = Real
    campoPix("54", valor.toFixed(2)) +
    campoPix("58", "BR") +
    campoPix("59", semAcento(nome).substring(0, 25)) +
    campoPix("60", semAcento(cidade).substring(0, 15)) +
    campoPix("62", campoPix("05", idPedido)) +
    "6304";

  return codigo + crc16(codigo);
}
