import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./lib/auth-context";
import { MapHome } from "./pages/MapHome";
import { CreateOffer } from "./pages/CreateOffer";
import { Login } from "./pages/Login";
import { AuthVerify } from "./pages/AuthVerify";
import { OfferDetail } from "./pages/OfferDetail";

export default function App() {
	return (
		<AuthProvider>
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<MapHome />} />
					<Route path="neu" element={<CreateOffer />} />
					<Route path="login" element={<Login />} />
					<Route path="auth/verify" element={<AuthVerify />} />
					<Route path="angebot/:id" element={<OfferDetail />} />
				</Route>
			</Routes>
		</AuthProvider>
	);
}
