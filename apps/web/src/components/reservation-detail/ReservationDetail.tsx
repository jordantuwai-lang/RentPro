'use client';
import { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { ReservationFormProvider, useRezForm } from './ReservationFormContext';
import { TabBar } from './shared/TabBar';
import { SaveIndicator } from './shared/SaveIndicator';
import { MainTab } from './tabs/MainTab';
import { CustomerTab } from './tabs/CustomerTab';
import { AtFaultTab } from './tabs/AtFaultTab';
import { OtherPartyTab } from './tabs/OtherPartyTab';
import { AccidentTab } from './tabs/AccidentTab';
import { DamagesTab } from './tabs/DamagesTab';
import { PhotosTab } from './tabs/PhotosTab';
import { AdditionalTab } from './tabs/AdditionalTab';
import { NotesTab } from './tabs/NotesTab';
import { RequirementsTab } from './tabs/RequirementsTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { ClaimsTab } from './tabs/ClaimsTab';

export interface ReservationDetailProps {
  reservationId?: string;
  initialData?: any;
  onSaveSuccess?: () => void;
}

export default function ReservationDetail({ reservationId, initialData, onSaveSuccess }: ReservationDetailProps) {
  return (
    <ReservationFormProvider initialData={initialData} reservationId={reservationId} onSaveSuccess={onSaveSuccess}>
      <ReservationDetailInner initialData={initialData} />
    </ReservationFormProvider>
  );
}

function ReservationDetailInner({ initialData }: { initialData?: any }) {
  const form = useRezForm();
  const { isClaimsRole } = useUserRole();
  const [activeKey, setActiveKey] = useState('main');

  const claim = initialData?.claim ?? null;
  // A Claim row can exist before on-hire (backend creates it eagerly on some writes), so
  // gate on status === 'ACTIVE' too — otherwise the tab would leak onto draft reservations.
  const showClaimsTab = form.reservationStatus === 'ACTIVE' && !!claim && isClaimsRole;

  const TAB_DEFS: { key: string; label: string }[] = [
    { key: 'main', label: 'Main' },
    { key: 'customer', label: 'Customer' },
    { key: 'atFault', label: 'At Fault' },
    { key: 'otherParty', label: 'Other Party' },
    { key: 'accident', label: 'Accident' },
    { key: 'damages', label: 'Damages' },
    { key: 'photos', label: 'Photos' },
    { key: 'additional', label: 'Additional' },
    { key: 'notes', label: 'Notes' },
    { key: 'requirements', label: 'Requirements' },
    { key: 'documents', label: 'Documents' },
    ...(showClaimsTab ? [{ key: 'claims', label: 'Claims' }] : []),
  ];

  return (
    <div style={{ maxWidth: '1100px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', minHeight: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: '#01ae42', color: '#fff', fontWeight: 700, fontSize: '11px', padding: '2px 8px', borderRadius: '5px', letterSpacing: '0.05em' }}>
            {form.reservationId ? 'EDIT' : 'NEW'}
          </span>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {form.reservationStatus === 'ACTIVE' && form.fileNumber ? `File # ${form.fileNumber}` : `Reservation # ${form.rezNumber || 'Generating…'}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SaveIndicator state={form.isSaving ? 'saving' : form.saveSuccess ? 'saved' : form.saveError ? 'error' : 'idle'} />
          {form.saveError && <span style={{ fontSize: '12px', color: '#dc2626' }}>{form.saveError}</span>}
          <button
            onClick={form.save}
            disabled={form.isSaving}
            style={{ padding: '7px 20px', fontSize: '13px', fontWeight: 700, border: 'none', borderRadius: '8px', background: form.isSaving ? '#94a3b8' : '#01ae42', color: '#fff', cursor: form.isSaving ? 'not-allowed' : 'pointer' }}
          >
            {form.isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <TabBar tabs={TAB_DEFS} active={activeKey} onChange={setActiveKey} />

      {activeKey === 'main' && <MainTab />}
      {activeKey === 'customer' && <CustomerTab />}
      {activeKey === 'atFault' && <AtFaultTab />}
      {activeKey === 'otherParty' && <OtherPartyTab />}
      {activeKey === 'accident' && <AccidentTab />}
      {activeKey === 'damages' && <DamagesTab />}
      {activeKey === 'photos' && <PhotosTab />}
      {activeKey === 'additional' && <AdditionalTab />}
      {activeKey === 'notes' && (
        form.reservationId
          ? <NotesTab reservationId={form.reservationId} />
          : <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Save the reservation before adding notes.</div>
      )}
      {activeKey === 'requirements' && <RequirementsTab />}
      {activeKey === 'documents' && <DocumentsTab />}
      {activeKey === 'claims' && form.reservationId && <ClaimsTab reservationId={form.reservationId} claim={claim} />}
    </div>
  );
}
