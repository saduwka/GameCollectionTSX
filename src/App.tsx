import { BrowserRouter } from "react-router-dom";
import PageRoutes from "./PageRoutes";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
