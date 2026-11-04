import AsyncStorage from "@react-native-async-storage/async-storage";
import { criarPersistenciaCarrinho } from "../utils/persistenciaCarrinho";

const persistencia = criarPersistenciaCarrinho(
  AsyncStorage,
  "traca_carrinho_v1",
);

export const restaurarCarrinho = persistencia.restaurar;
export const salvarCarrinho = persistencia.salvar;
