import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { AreaSelect } from "../components/AreaSelect";
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
import { isPublicArea, suggestPublicArea } from "../../shared/areas";

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
			address_hint: isPublicArea(a.address_hint)
				? a.address_hint
				: (suggestPublicArea(a.address_hint || a.address_text) ?? ""),
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
		const address_hint = form.address_hint.trim();
		if (!address_text) {
			setError("Bitte die volle Adresse angeben.");
			return;
		}
		if (!address_hint || !isPublicArea(address_hint)) {
			setError("Bitte Stadtteil / Gegend aus der Liste wählen.");
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
				address_hint,
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
			<div className="page profile-page">
				<p className="muted" role="status">
					Einen Moment…
				</p>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const pick: [number, number] | null =
		form.lat != null && form.lng != null ? [form.lat, form.lng] : null;

	return (
		<div className="page profile-page">
			<p className="back">
				<Link to="/">← Karte</Link>
			</p>

			<header className="page-header">
				<h1>Konto</h1>
			</header>

			<div className="banner info profile-user-card">
				<span className="profile-user-info">
					<strong className="profile-user-name">
						{user.display_name || user.email}
					</strong>
					<br />
					<small className="muted">{user.email}</small>
				</span>
				<button type="button" className="btn btn-sm" onClick={() => void logout()}>
					Abmelden
				</button>
			</div>

			<section className="panel-block panel-section profile-addresses">
				<div className="panel-head">
					<h2>Gespeicherte Adressen</h2>
					{!showForm && addresses.length < max && (
						<button
							type="button"
							className="btn btn-sm btn-primary"
							onClick={startCreate}
						>
							+ Adresse
						</button>
					)}
				</div>
				<p className="muted small panel-section-hint">
					Adressen hier verwalten und im Angebot-Formular auswählen oder
					automatisch vorausfüllen (Standard). Max. {max} Stück.
				</p>

				{listLoading && (
					<p className="muted" role="status">
						Lade Adressen…
					</p>
				)}

				{!listLoading && addresses.length === 0 && !showForm && (
					<div className="empty-state">
						<span className="empty-state-icon" aria-hidden>
							🏠
						</span>
						<p className="empty-state-title">Noch keine Adresse</p>
						<p className="empty-state-text">
							Speichere Zuhause oder Keller – beim Einstellen ist sie dann per
							Klick da.
						</p>
						<button
							type="button"
							className="btn btn-primary btn-sm"
							onClick={startCreate}
						>
							Erste Adresse anlegen
						</button>
					</div>
				)}

				{addresses.length > 0 && (
					<ul className="list address-card-list">
						{addresses.map((a) => (
							<li key={a.id} className="list-item address-card">
								<div className="list-item-main address-card-head">
									<strong className="list-item-title">
										{a.label || "Adresse"}
									</strong>
									{a.is_default && (
										<span className="badge badge-ok">Standard</span>
									)}
								</div>
								<div className="meta list-item-meta address-card-text">
									{a.address_text}
								</div>
								{a.address_hint && (
									<div className="meta muted small list-item-meta">
										{a.address_hint}
									</div>
								)}
								<div className="address-actions list-item-actions">
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
					<form className="form address-form" onSubmit={onSave}>
						<section className="form-section">
							<h3 className="form-section-title">
								{editingId ? "Adresse bearbeiten" : "Neue Adresse"}
							</h3>
							<label>
								Kurzname
								<input
									value={form.label}
									onChange={(e) =>
										setForm((f) => ({ ...f, label: e.target.value }))
									}
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
								<AreaSelect
									value={form.address_hint}
									required
									onChange={(v) =>
										setForm((f) => ({ ...f, address_hint: v }))
									}
								/>
								<span className="muted small">
									Wird auf der Karte angezeigt – aus der Liste wählen.
								</span>
							</label>
						</section>
						<section className="form-section">
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
											setForm((f) => {
												let nextHint = f.address_hint;
												if (
													(!f.address_hint || !isPublicArea(f.address_hint)) &&
													label &&
													label !== "Mein Standort"
												) {
													nextHint =
														suggestPublicArea(label) ?? f.address_hint;
												}
												return {
													...f,
													lat,
													lng,
													address_text:
														label && label !== "Mein Standort"
															? label
															: f.address_text,
													address_hint: nextHint,
												};
											});
										}}
										className="map map-sm"
									/>
								</div>
								{pick ? (
									<p className="muted small map-pin-status">
										Standort: {pick[0].toFixed(5)}, {pick[1].toFixed(5)}
									</p>
								) : (
									<p className="muted small map-pin-status">
										Noch kein Punkt auf der Karte.
									</p>
								)}
							</div>
						</section>
						<div className="actions sticky-actions form-actions-row">
							<button
								className="btn btn-primary"
								type="submit"
								disabled={saving}
							>
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

			<nav className="profile-footer-links muted small">
				<Link to="/neu">Angebot erstellen</Link>
				<span aria-hidden> · </span>
				<Link to="/">Zur Karte</Link>
			</nav>
		</div>
	);
}
