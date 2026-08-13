import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./lib/auth-context";
import { MapHome } from "./pages/MapHome";
import { CreateOffer } from "./pages/CreateOffer";
import { Login } from "./pages/Login";
import { AuthVerify } from "./pages/AuthVerify";
import { OfferDetail } from "./pages/OfferDetail";
import { RecurringDetail } from "./pages/RecurringDetail";
import { Profile } from "./pages/Profile";
import { RoutePlanner } from "./pages/RoutePlanner";
import { Impressum } from "./pages/Impressum";
import { Datenschutz } from "./pages/Datenschutz";
import { Agb } from "./pages/Agb";
import { Cookies } from "./pages/Cookies";

export default function App() {
	return (
		<AuthProvider>
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<MapHome />} />
					<Route path="neu" element={<CreateOffer />} />
					<Route path="route" element={<RoutePlanner />} />
					<Route path="login" element={<Login />} />
					<Route path="profil" element={<Profile />} />
					<Route path="auth/verify" element={<AuthVerify />} />
					<Route path="angebot/:id" element={<OfferDetail />} />
					<Route path="woche/:id" element={<RecurringDetail />} />
					<Route path="impressum" element={<Impressum />} />
					<Route path="datenschutz" element={<Datenschutz />} />
					<Route path="cookies" element={<Cookies />} />
					<Route path="agb" element={<Agb />} />
				</Route>
			</Routes>
		</AuthProvider>
	);
}
