import PageRoutes from "./PageRoutes";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <PageRoutes />
    </AuthProvider>
  );
}

export default App;
