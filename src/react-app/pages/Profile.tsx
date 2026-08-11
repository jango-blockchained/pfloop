import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { OfferMap } from "../components/OfferMap";
import {
	createAddress,
	deleteAddress,
	fetchMyAddresses,
	getErrorMessage,
	setDefaultAddress,
	updateAddress,
	type SavedAddress,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";

const emptyForm = {
	label: "",
	address_text: "",
	address_hint: "",
	lat: null as number | null,
	lng: null as number | null,
};

export function Profile() {
	const { user, loading, logout } = useAuth();
	const [addresses, setAddresses] = useState<SavedAddress[]>([]);
	const [max, setMax] = useState(8);
	const [listLoading, setListLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [okMsg, setOkMsg] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState(emptyForm);
	const [saving, setSaving] = useState(false);

	const load = useCallback(async () => {
		try {
			const data = await fetchMyAddresses();
			setAddresses(data.addresses);
			setMax(data.max);
			setError(null);
		} catch (e) {
			setError(getErrorMessage(e, "Adressen laden hat nicht geklappt"));
		} finally {
			setListLoading(false);
		}
	}, []);

	useEffect(() => {
		if (user) void load();
	}, [user, load]);

	function startCreate() {
		setEditingId(null);
		setForm(emptyForm);
		setShowForm(true);
		setOkMsg(null);
		setError(null);
	}

	function startEdit(a: SavedAddress) {
		setEditingId(a.id);
		setForm({
			label: a.label,
			address_text: a.address_text,
			address_hint: a.address_hint,
			lat: a.lat,
			lng: a.lng,
		});
		setShowForm(true);
		setOkMsg(null);
		setError(null);
	}

	function cancelForm() {
		setShowForm(false);
		setEditingId(null);
		setForm(emptyForm);
	}

	async function onSave(e: FormEvent) {
		e.preventDefault();
		if (saving) return;
		setError(null);
		setOkMsg(null);

		const address_text = form.address_text.trim();
		if (!address_text) {
			setError("Bitte die volle Adresse angeben.");
			return;
		}
		if (form.lat == null || form.lng == null) {
			setError("Setz bitte noch einen Punkt auf der Karte.");
			return;
		}

		setSaving(true);
		try {
			const body = {
				label: form.label.trim() || undefined,
				address_text,
				address_hint: form.address_hint.trim() || undefined,
				lat: form.lat,
				lng: form.lng,
				is_default: addresses.length === 0 && !editingId ? true : undefined,
			};
			if (editingId) {
				await updateAddress(editingId, body);
				setOkMsg("Adresse gespeichert.");
			} else {
				await createAddress(body);
				setOkMsg("Adresse hinzugefügt.");
			}
			cancelForm();
			await load();
		} catch (err) {
			setError(getErrorMessage(err, "Speichern hat nicht geklappt"));
		} finally {
			setSaving(false);
		}
	}

	async function onDefault(id: string) {
		setBusyId(id);
		setError(null);
		try {
			await setDefaultAddress(id);
			setOkMsg("Als Standard gesetzt – wird im Angebot-Formular vorausgefüllt.");
			await load();
		} catch (e) {
			setError(getErrorMessage(e, "Standard setzen hat nicht geklappt"));
		} finally {
			setBusyId(null);
		}
	}

	async function onDelete(id: string) {
		if (!confirm("Diese Adresse wirklich löschen?")) return;
		setBusyId(id);
		setError(null);
		try {
			await deleteAddress(id);
			setOkMsg("Adresse gelöscht.");
			if (editingId === id) cancelForm();
			await load();
		} catch (e) {
			setError(getErrorMessage(e, "Löschen hat nicht geklappt"));
		} finally {
			setBusyId(null);
		}
	}

	if (loading) {
		return (
			<div className="page">
				<p className="muted">Einen Moment…</p>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const pick: [number, number] | null =
		form.lat != null && form.lng != null ? [form.lat, form.lng] : null;

	return (
		<div className="page">
			<p className="back">
				<Link to="/">← Karte</Link>
			</p>
			<h1>Konto</h1>

			<div className="banner info">
				<span>
					<strong>{user.display_name || user.email}</strong>
					<br />
					<small className="muted">{user.email}</small>
				</span>
				<button type="button" className="btn btn-sm" onClick={() => void logout()}>
					Abmelden
				</button>
			</div>

			<section className="panel-block profile-addresses" style={{ marginTop: "1.25rem" }}>
				<div className="panel-head">
					<h2>Gespeicherte Adressen</h2>
					{!showForm && addresses.length < max && (
						<button type="button" className="btn btn-sm btn-primary" onClick={startCreate}>
							+ Adresse
						</button>
					)}
				</div>
				<p className="muted small" style={{ marginTop: 0 }}>
					Adressen hier verwalten und im Angebot-Formular auswählen oder
					automatisch vorausfüllen (Standard). Max. {max} Stück.
				</p>

				{listLoading && <p className="muted">Lade Adressen…</p>}

				{!listLoading && addresses.length === 0 && !showForm && (
					<div className="empty-state">
						<p className="muted">Noch keine Adresse gespeichert.</p>
						<button type="button" className="btn btn-primary btn-sm" onClick={startCreate}>
							Erste Adresse anlegen
						</button>
					</div>
				)}

				{addresses.length > 0 && (
					<ul className="list">
						{addresses.map((a) => (
							<li key={a.id} className="list-item">
								<div>
									<strong>{a.label || "Adresse"}</strong>
									{a.is_default && (
										<span className="badge badge-ok">Standard</span>
									)}
								</div>
								<div className="meta">{a.address_text}</div>
								{a.address_hint && (
									<div className="meta muted small">{a.address_hint}</div>
								)}
								<div className="address-actions" style={{ marginTop: "0.45rem" }}>
									{!a.is_default && (
										<button
											type="button"
											className="btn btn-sm"
											disabled={busyId === a.id}
											onClick={() => void onDefault(a.id)}
										>
											Als Standard
										</button>
									)}
									<button
										type="button"
										className="btn btn-sm"
										disabled={busyId === a.id}
										onClick={() => startEdit(a)}
									>
										Bearbeiten
									</button>
									<button
										type="button"
										className="btn btn-sm"
										disabled={busyId === a.id}
										onClick={() => void onDelete(a.id)}
									>
										Löschen
									</button>
								</div>
							</li>
						))}
					</ul>
				)}

				{showForm && (
					<form className="form" onSubmit={onSave} style={{ marginTop: "1rem" }}>
						<h3 className="form-section-title" style={{ margin: 0 }}>
							{editingId ? "Adresse bearbeiten" : "Neue Adresse"}
						</h3>
						<label>
							Kurzname
							<input
								value={form.label}
								onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
								placeholder="z. B. Zuhause, Keller"
								maxLength={40}
							/>
						</label>
						<label>
							Volle Adresse
							<input
								value={form.address_text}
								onChange={(e) =>
									setForm((f) => ({ ...f, address_text: e.target.value }))
								}
								placeholder="Musterstraße 1, 10115 Berlin"
								required
								autoComplete="street-address"
							/>
						</label>
						<label>
							Stadtteil / Gegend (öffentlich)
							<input
								value={form.address_hint}
								onChange={(e) =>
									setForm((f) => ({ ...f, address_hint: e.target.value }))
								}
								placeholder="Berlin-Mitte"
							/>
						</label>
						<div className="form-map">
							<p className="label">Standort auf der Karte</p>
							<div className="form-map-inner">
								<OfferMap
									offers={[]}
									pickMode
									pickPosition={pick}
									showControls
									center={pick ?? undefined}
									onPick={(lat, lng) =>
										setForm((f) => ({ ...f, lat, lng }))
									}
									onLocationResolved={({ lat, lng, label }) => {
										setForm((f) => ({
											...f,
											lat,
											lng,
											address_text:
												label && label !== "Mein Standort"
													? label
													: f.address_text,
											address_hint: (() => {
												if (f.address_hint || !label || label === "Mein Standort") {
													return f.address_hint;
												}
												const parts = label.split(",").map((s) => s.trim());
												return parts[parts.length - 1] ?? "";
											})(),
										}));
									}}
									className="map map-sm"
								/>
							</div>
							{pick ? (
								<p className="muted small">
									Standort: {pick[0].toFixed(5)}, {pick[1].toFixed(5)}
								</p>
							) : (
								<p className="muted small">Noch kein Punkt auf der Karte.</p>
							)}
						</div>
						<div className="actions" style={{ flexDirection: "row", flexWrap: "wrap" }}>
							<button className="btn btn-primary" type="submit" disabled={saving}>
								{saving ? "Speichern…" : "Speichern"}
							</button>
							<button
								type="button"
								className="btn"
								disabled={saving}
								onClick={cancelForm}
							>
								Abbrechen
							</button>
						</div>
					</form>
				)}
			</section>

			{okMsg && <p className="banner ok">{okMsg}</p>}
			{error && <p className="banner error">{error}</p>}

			<p className="muted small" style={{ marginTop: "1.25rem" }}>
				<Link to="/neu">Angebot erstellen</Link> ·{" "}
				<Link to="/">Zur Karte</Link>
			</p>
		</div>
	);
}
