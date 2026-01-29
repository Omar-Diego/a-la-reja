import Header from "./components/layout/Header";
import Hero from "./components/landing/Hero";
import TodoLoQueNecesitas from "./components/landing/TodoLoQueNecesitas";
import ListoParaJugar from "./components/landing/ListoParaJugar";
import Footer from "./components/layout/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <TodoLoQueNecesitas />
      <ListoParaJugar />
      <Footer />
    </>
  );
}
