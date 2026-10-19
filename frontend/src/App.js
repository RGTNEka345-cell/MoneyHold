
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import CustomerSessionProvider from './components/Customer/CustomerSessionProvider';
import CartProvider from './components/Customer/CartProvider';

function App() {
  return (
    <BrowserRouter>
      <CustomerSessionProvider><CartProvider><AppRoutes /></CartProvider></CustomerSessionProvider>
    </BrowserRouter>
  );
}

export default App;
