import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

import backArrow from './assets/back-arrow.webp';
import pontos from './assets/3-pontos.png';
import imagemQuadra from './assets/imagem-quadra.jpg';

const NavBar = () => {
  return (
    <View style={styles.nav}>
      <TouchableOpacity style={styles.botaoVoltar}>
        <Image style={styles.imagemBotaoVoltar} source={backArrow} />
      </TouchableOpacity>
      <Text style={styles.titulo}>Quadra Exemplo</Text>
      <TouchableOpacity style={styles.botaoPontos}>
        <Image style={styles.imagemPontos} source={pontos} />
      </TouchableOpacity>
    </View>
  );
};

const ImgQuadra = () => {
  return (
    <View style={styles.containerImagemQuadra}>
      <Image style={styles.imagemQuadra} source={imagemQuadra} />
    </View>
  );
};

const DadosQuadra = () => {
  return (
    <View style={styles.dadosContainer}>
      <Text style={styles.textoDados}>Endereço Exemplo</Text>
      <Text style={styles.textoDados}>Esportes:</Text>
      <Text style={styles.textoDados}>Avaliações</Text>
      <Text style={styles.textoDados}>Atividade</Text>
      <Text style={styles.textoDados}>Contatos: (21) 90028922</Text>
    </View>
  );
};


export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <NavBar />
      <ImgQuadra />
      <DadosQuadra/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    marginTop: 50,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    width: '100%',
    height: 60,
    backgroundColor: 'white',
  },
  botaoVoltar: {
    width: 40,
    height: 40
  },
  imagemBotaoVoltar: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
  titulo: {
    color: 'black',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  botaoPontos: {
    width: 30,
    height: 30,
  },
  imagemPontos: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  containerImagemQuadra: {
    justifyContent: 'center',
    marginTop:20,
    alignItems: 'center',
  },
  imagemQuadra: {
    width: '90%',
    height: 300, 
    resizeMode: 'contain',
  },

  dadosContainer: {
    alignItems: 'flex-start', 
    marginVertical: 20, 
    paddingHorizontal: 20, 
  },
  textoDados: {
    fontSize: 24, 
    textAlign: 'left', 
    marginBottom: 10,
  },
  
});
