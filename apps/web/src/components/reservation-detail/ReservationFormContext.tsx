'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { DocFile } from './shared/DocFileSlot';

export interface RezForm {
  // Raw reservation as loaded (for read-only display: charges, createdAt, claim, vehicle, etc.)
  reservation: any;

  // Customer / Driver
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  mi: string; setMi: (v: string) => void;
  homePhone: string; setHomePhone: (v: string) => void;
  mobile: string; setMobile: (v: string) => void;
  workPhone: string; setWorkPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  street1: string; setStreet1: (v: string) => void;
  street2: string; setStreet2: (v: string) => void;
  city: string; setCity: (v: string) => void;
  stateVal: string; setStateVal: (v: string) => void;
  postal: string; setPostal: (v: string) => void;
  country: string; setCountry: (v: string) => void;
  licNum: string; setLicNum: (v: string) => void;
  licState: string; setLicState: (v: string) => void;
  licExpires: string; setLicExpires: (v: string) => void;
  dob: string; setDob: (v: string) => void;
  // Rental
  pickupDate: string; setPickupDate: (v: string) => void;
  dropDate: string; setDropDate: (v: string) => void;
  source: string; setSource: (v: string) => void;
  partnerName: string; setPartnerName: (v: string) => void;
  hireType: string; setHireType: (v: string) => void;
  broadcastNote: string; setBroadcastNote: (v: string) => void;
  // Accident
  accDate: string; setAccDate: (v: string) => void;
  accStreet: string; setAccStreet: (v: string) => void;
  accSuburb: string; setAccSuburb: (v: string) => void;
  accDescription: string; setAccDescription: (v: string) => void;
  // At Fault Third Party
  tpFirstName: string; setTpFirstName: (v: string) => void;
  tpLastName: string; setTpLastName: (v: string) => void;
  tpPhone: string; setTpPhone: (v: string) => void;
  tpEmail: string; setTpEmail: (v: string) => void;
  tpAddress: string; setTpAddress: (v: string) => void;
  tpSuburb: string; setTpSuburb: (v: string) => void;
  tpPostal: string; setTpPostal: (v: string) => void;
  tpState: string; setTpState: (v: string) => void;
  tpVehRego: string; setTpVehRego: (v: string) => void;
  tpVehMake: string; setTpVehMake: (v: string) => void;
  tpVehModel: string; setTpVehModel: (v: string) => void;
  tpVehYear: string; setTpVehYear: (v: string) => void;
  tpInsCarrier: string; setTpInsCarrier: (v: string) => void;
  tpClaimNo: string; setTpClaimNo: (v: string) => void;
  // Registered Owner
  roFirstName: string; setRoFirstName: (v: string) => void;
  roLastName: string; setRoLastName: (v: string) => void;
  roMi: string; setRoMi: (v: string) => void;
  roDob: string; setRoDob: (v: string) => void;
  roMobile: string; setRoMobile: (v: string) => void;
  roHomePhone: string; setRoHomePhone: (v: string) => void;
  roWorkPhone: string; setRoWorkPhone: (v: string) => void;
  roEmail: string; setRoEmail: (v: string) => void;
  roAltId: string; setRoAltId: (v: string) => void;
  roStreet1: string; setRoStreet1: (v: string) => void;
  roStreet2: string; setRoStreet2: (v: string) => void;
  roCity: string; setRoCity: (v: string) => void;
  roState: string; setRoState: (v: string) => void;
  roPostal: string; setRoPostal: (v: string) => void;
  roCountry: string; setRoCountry: (v: string) => void;
  roLicNum: string; setRoLicNum: (v: string) => void;
  roLicState: string; setRoLicState: (v: string) => void;
  roLicExpires: string; setRoLicExpires: (v: string) => void;
  // Documents
  authorityToAct: DocFile | null; setAuthorityToAct: (v: DocFile | null) => void;
  rentalAgreement: DocFile | null; setRentalAgreement: (v: DocFile | null) => void;
  // Assigned Fleet
  assignedRego: string; setAssignedRego: (v: string) => void;
  assignedVehicleId: string; setAssignedVehicleId: (v: string) => void;
  // Pickup & Return
  pickupLoc: string; setPickupLoc: (v: string) => void;
  dropLoc: string; setDropLoc: (v: string) => void;
  // Rate & Vehicle
  ratePlanType: string; setRatePlanType: (v: string) => void;
  rateCode: string; setRateCode: (v: string) => void;
  rateClass: string; setRateClass: (v: string) => void;
  estKms: string; setEstKms: (v: string) => void;
  availUnits: string; setAvailUnits: (v: string) => void;
  unit: string; setUnit: (v: string) => void;
  unitDesc: string; setUnitDesc: (v: string) => void;
  // NAF Vehicle
  nafRego: string; setNafRego: (v: string) => void;
  nafYear: string; setNafYear: (v: string) => void;
  nafMake: string; setNafMake: (v: string) => void;
  nafModel: string; setNafModel: (v: string) => void;
  nafBodyType: string; setNafBodyType: (v: string) => void;
  // NAF Insurance & Cover
  nafInsCarrier: string; setNafInsCarrier: (v: string) => void;
  nafInsPolicy: string; setNafInsPolicy: (v: string) => void;
  nafInsPhone: string; setNafInsPhone: (v: string) => void;
  nafInsAgent: string; setNafInsAgent: (v: string) => void;
  nafInsAgency: string; setNafInsAgency: (v: string) => void;
  nafCoverType: string; setNafCoverType: (v: string) => void;
  // Meta
  rezNumber: string;
  fileNumber: string;
  reservationId: string | null;
  isSaving: boolean;
  saveError: string;
  saveSuccess: boolean;
  save: () => Promise<string | null>;
  reservationStatus: string;
  putOnHire: () => Promise<void>;
  puttingOnHire: boolean;
  onHireError: string;
  uploadDocument: (kind: 'authorityToAct' | 'rentalAgreement', file: File) => Promise<void>;
  removeDocument: (kind: 'authorityToAct' | 'rentalAgreement') => Promise<void>;
  uploadingAuthorityToAct: boolean;
  uploadingRentalAgreement: boolean;
  docError: string;
}

const RezFormContext = createContext<RezForm | null>(null);

export const useRezForm = () => {
  const ctx = useContext(RezFormContext);
  if (!ctx) throw new Error('useRezForm must be used inside ReservationFormProvider');
  return ctx;
};

export function ReservationFormProvider({ initialData, reservationId: initialResId, onSaveSuccess, children }: {
  initialData?: any; reservationId?: string; onSaveSuccess?: () => void; children: React.ReactNode;
}) {
  const { getToken } = useAuth();
  const router = useRouter();

  const c = initialData?.customer ?? {};
  const acc = initialData?.accident ?? {};
  const af = initialData?.atFault ?? {};

  const [firstName, setFirstName] = useState(c.firstName ?? '');
  const [lastName, setLastName] = useState(c.lastName ?? '');
  const [mi, setMi] = useState('');
  const [homePhone, setHomePhone] = useState(c.phone ?? '');
  const [mobile, setMobile] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [email, setEmail] = useState(c.email ?? '');
  const [street1, setStreet1] = useState(c.address ?? '');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState(c.suburb ?? '');
  const [stateVal, setStateVal] = useState(c.state ?? '');
  const [postal, setPostal] = useState(c.postcode ?? '');
  const [country, setCountry] = useState('');
  const [licNum, setLicNum] = useState(c.licenceNumber ?? '');
  const [licState, setLicState] = useState(c.licenceState ?? '');
  const [licExpires, setLicExpires] = useState(c.licenceExpiry ? c.licenceExpiry.slice(0, 10) : '');
  const [dob, setDob] = useState(c.dob ? c.dob.slice(0, 10) : '');
  const [pickupDate, setPickupDate] = useState(initialData?.startDate ? initialData.startDate.slice(0, 10) : '');
  const [dropDate, setDropDate] = useState(initialData?.endDate ? initialData.endDate.slice(0, 10) : '');
  const [source, setSource] = useState(initialData?.sourceOfBusiness ?? '');
  const [partnerName, setPartnerName] = useState(initialData?.partnerName ?? '');
  const [hireType, setHireType] = useState(initialData?.hireType ?? 'credit');
  const [broadcastNote, setBroadcastNote] = useState(initialData?.broadcastNote ?? '');
  const [accDate, setAccDate] = useState(acc.date ? acc.date.slice(0, 10) : '');
  const [accStreet, setAccStreet] = useState(acc.location ?? '');
  const [accSuburb, setAccSuburb] = useState('');
  const [accDescription, setAccDescription] = useState(acc.description ?? '');
  const [tpFirstName, setTpFirstName] = useState(af.firstName ?? '');
  const [tpLastName, setTpLastName] = useState(af.lastName ?? '');
  const [tpPhone, setTpPhone] = useState(af.phone ?? '');
  const [tpEmail, setTpEmail] = useState(af.email ?? '');
  const [tpAddress, setTpAddress] = useState(af.address ?? '');
  const [tpSuburb, setTpSuburb] = useState(af.suburb ?? '');
  const [tpPostal, setTpPostal] = useState(af.postcode ?? '');
  const [tpState, setTpState] = useState(af.state ?? '');
  const [tpVehRego, setTpVehRego] = useState(af.vehicleRegistration ?? '');
  const [tpVehMake, setTpVehMake] = useState(af.vehicleMake ?? '');
  const [tpVehModel, setTpVehModel] = useState(af.vehicleModel ?? '');
  const [tpVehYear, setTpVehYear] = useState(af.vehicleYear ?? '');
  const [tpInsCarrier, setTpInsCarrier] = useState(af.insuranceProvider ?? '');
  const [tpClaimNo, setTpClaimNo] = useState(af.claimNumber ?? '');

  const [roFirstName, setRoFirstName] = useState('');
  const [roLastName, setRoLastName] = useState('');
  const [roMi, setRoMi] = useState('');
  const [roDob, setRoDob] = useState('');
  const [roMobile, setRoMobile] = useState('');
  const [roHomePhone, setRoHomePhone] = useState('');
  const [roWorkPhone, setRoWorkPhone] = useState('');
  const [roEmail, setRoEmail] = useState('');
  const [roAltId, setRoAltId] = useState('');
  const [roStreet1, setRoStreet1] = useState('');
  const [roStreet2, setRoStreet2] = useState('');
  const [roCity, setRoCity] = useState('');
  const [roState, setRoState] = useState('');
  const [roPostal, setRoPostal] = useState('');
  const [roCountry, setRoCountry] = useState('');
  const [roLicNum, setRoLicNum] = useState('');
  const [roLicState, setRoLicState] = useState('');
  const [roLicExpires, setRoLicExpires] = useState('');

  const [authorityToAct, setAuthorityToAct] = useState<DocFile | null>(
    initialData?.authorityToActUrl ? { name: initialData.authorityToActName || 'Authority to Act', dataUrl: initialData.authorityToActUrl } : null
  );
  const [rentalAgreement, setRentalAgreement] = useState<DocFile | null>(
    initialData?.rentalAgreementUrl ? { name: initialData.rentalAgreementName || 'Rental Agreement', dataUrl: initialData.rentalAgreementUrl } : null
  );

  const [assignedRego, setAssignedRego] = useState(initialData?.vehicle?.registration ?? '');
  const [assignedVehicleId, setAssignedVehicleId] = useState(initialData?.vehicleId ?? initialData?.vehicle?.id ?? '');

  const [pickupLoc, setPickupLoc] = useState(initialData?.pickupBranchId ?? '');
  const [dropLoc, setDropLoc] = useState(initialData?.returnBranchId ?? '');

  const [ratePlanType, setRatePlanType] = useState(initialData?.ratePlanType ?? '');
  const [rateCode, setRateCode] = useState(initialData?.rateCode ?? '');
  const [rateClass, setRateClass] = useState(initialData?.rateClass ?? '');
  const [estKms, setEstKms] = useState(initialData?.estimatedKms ?? '');
  const [availUnits, setAvailUnits] = useState(initialData?.unitNumber ?? '');
  const [unit, setUnit] = useState(initialData?.unitTag ?? '');
  const [unitDesc, setUnitDesc] = useState(initialData?.unitDescription ?? '');

  const [nafRego, setNafRego] = useState(initialData?.nafRego ?? '');
  const [nafYear, setNafYear] = useState(initialData?.nafYear ?? '');
  const [nafMake, setNafMake] = useState(initialData?.nafMake ?? '');
  const [nafModel, setNafModel] = useState(initialData?.nafModel ?? '');
  const [nafBodyType, setNafBodyType] = useState(initialData?.nafBodyType ?? '');

  const [nafInsCarrier, setNafInsCarrier] = useState(initialData?.nafInsCarrier ?? '');
  const [nafInsPolicy, setNafInsPolicy] = useState(initialData?.nafInsPolicy ?? '');
  const [nafInsPhone, setNafInsPhone] = useState(initialData?.nafInsPhone ?? '');
  const [nafInsAgent, setNafInsAgent] = useState(initialData?.nafInsAgent ?? '');
  const [nafInsAgency, setNafInsAgency] = useState(initialData?.nafInsAgency ?? '');
  const [nafCoverType, setNafCoverType] = useState(initialData?.nafCoverType ?? 'CTP');

  const [reservationId, setReservationId] = useState<string | null>(initialResId ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [rezNumber, setRezNumber] = useState(initialData?.reservationNumber ?? '');
  const [fileNumber, setFileNumber] = useState(initialData?.fileNumber ?? '');
  const [reservationStatus, setReservationStatus] = useState(initialData?.status ?? 'DRAFT');
  const [puttingOnHire, setPuttingOnHire] = useState(false);
  const [onHireError, setOnHireError] = useState('');
  const [uploadingAuthorityToAct, setUploadingAuthorityToAct] = useState(false);
  const [uploadingRentalAgreement, setUploadingRentalAgreement] = useState(false);
  const [docError, setDocError] = useState('');

  useEffect(() => {
    if (initialData?.reservationNumber || initialResId) return;
    getToken().then(token => {
      api.get('/reservations/next-number', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setRezNumber(res.data?.nextNumber ?? res.data ?? ''))
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (): Promise<string | null> => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        customer: {
          firstName, lastName,
          phone: mobile || homePhone,
          email: email || undefined,
          address: street1,
          suburb: city,
          postcode: postal,
          state: stateVal,
          licenceNumber: licNum || undefined,
          licenceState: licState || undefined,
          licenceExpiry: licExpires || undefined,
          dob: dob || undefined,
        },
        startDate: pickupDate || undefined,
        endDate: dropDate || undefined,
        sourceOfBusiness: source || undefined,
        partnerName: partnerName || undefined,
        broadcastNote: broadcastNote || undefined,
        hireType: hireType || undefined,
        vehicleId: assignedVehicleId || undefined,
        // Assigning a vehicle server-side immediately flips it to ON_HIRE unless the
        // reservation is explicitly a DRAFT — keep it a draft until Put On Hire (which
        // uses the dedicated /on-hire endpoint) so picking a rego here doesn't lock the
        // vehicle before the Authority to Act / Rental Agreement are signed.
        status: reservationStatus === 'ACTIVE' ? undefined : 'DRAFT',
        accident: (accDate || accDescription) ? {
          date: accDate || undefined,
          location: accStreet ? `${accStreet}${accSuburb ? ', ' + accSuburb : ''}` : undefined,
          description: accDescription || undefined,
        } : undefined,
        atFault: (tpLastName || tpVehRego) ? {
          firstName: tpFirstName || undefined,
          lastName: tpLastName || undefined,
          phone: tpPhone || undefined,
          email: tpEmail || undefined,
          address: tpAddress || undefined,
          suburb: tpSuburb || undefined,
          postcode: tpPostal || undefined,
          state: tpState || undefined,
          vehicleRegistration: tpVehRego || undefined,
          vehicleMake: tpVehMake || undefined,
          vehicleModel: tpVehModel || undefined,
          vehicleYear: tpVehYear || undefined,
          insuranceProvider: tpInsCarrier || undefined,
          claimNumber: tpClaimNo || undefined,
        } : undefined,
        pickupBranchId: pickupLoc || undefined,
        returnBranchId: dropLoc || undefined,
        ratePlanType: ratePlanType || undefined,
        rateCode: rateCode || undefined,
        rateClass: rateClass || undefined,
        estimatedKms: estKms || undefined,
        unitNumber: availUnits || undefined,
        unitTag: unit || undefined,
        unitDescription: unitDesc || undefined,
        naf: (nafRego || nafMake || nafModel) ? {
          rego: nafRego || undefined,
          year: nafYear || undefined,
          make: nafMake || undefined,
          model: nafModel || undefined,
          bodyType: nafBodyType || undefined,
          insCarrier: nafInsCarrier || undefined,
          insPolicy: nafInsPolicy || undefined,
          insPhone: nafInsPhone || undefined,
          insAgent: nafInsAgent || undefined,
          insAgency: nafInsAgency || undefined,
          coverType: nafCoverType || undefined,
        } : undefined,
      };

      let effectiveId = reservationId;
      if (reservationId) {
        await api.patch(`/reservations/${reservationId}`, payload, { headers });
      } else {
        const res = await api.post('/reservations', payload, { headers });
        effectiveId = res.data?.id ?? null;
        setReservationId(effectiveId);
        if (effectiveId) {
          router.replace(`/dashboard/reservations/${effectiveId}`);
        }
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onSaveSuccess?.();
      return effectiveId;
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setSaveError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Save failed. Please try again.'));
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const putOnHire = async () => {
    if (!reservationId) {
      setOnHireError('Save the reservation before putting it on hire.');
      return;
    }
    setPuttingOnHire(true);
    setOnHireError('');
    try {
      const token = await getToken();
      const res = await api.post(`/reservations/${reservationId}/on-hire`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setReservationStatus(res.data?.status ?? 'ACTIVE');
      setFileNumber(res.data?.fileNumber ?? '');
      onSaveSuccess?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setOnHireError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to put on hire. Please try again.'));
    } finally {
      setPuttingOnHire(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadDocument = async (kind: 'authorityToAct' | 'rentalAgreement', file: File) => {
    setDocError('');
    const setUploading = kind === 'authorityToAct' ? setUploadingAuthorityToAct : setUploadingRentalAgreement;
    setUploading(true);
    try {
      let id = reservationId;
      if (!id) {
        id = await save();
        if (!id) {
          setDocError('Save the reservation before uploading documents.');
          return;
        }
      }
      const fileData = await fileToBase64(file);
      const token = await getToken();
      const path = kind === 'authorityToAct' ? 'authority-to-act' : 'rental-agreement';
      const res = await api.post(
        `/reservations/${id}/${path}`,
        { fileData, mimeType: file.type, name: file.name },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const doc = { name: res.data?.name || file.name, dataUrl: res.data?.url || '' };
      if (kind === 'authorityToAct') setAuthorityToAct(doc);
      else setRentalAgreement(doc);
      onSaveSuccess?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setDocError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Upload failed. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (kind: 'authorityToAct' | 'rentalAgreement') => {
    setDocError('');
    try {
      if (reservationId) {
        const token = await getToken();
        const path = kind === 'authorityToAct' ? 'authority-to-act' : 'rental-agreement';
        await api.delete(`/reservations/${reservationId}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
      }
      if (kind === 'authorityToAct') setAuthorityToAct(null);
      else setRentalAgreement(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setDocError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to remove document.'));
    }
  };

  const formCtx: RezForm = {
    reservation: initialData,
    firstName, setFirstName, lastName, setLastName, mi, setMi,
    homePhone, setHomePhone, mobile, setMobile, workPhone, setWorkPhone,
    email, setEmail, street1, setStreet1, street2, setStreet2,
    city, setCity, stateVal, setStateVal, postal, setPostal, country, setCountry,
    licNum, setLicNum, licState, setLicState, licExpires, setLicExpires, dob, setDob,
    pickupDate, setPickupDate, dropDate, setDropDate, source, setSource,
    partnerName, setPartnerName, broadcastNote, setBroadcastNote,
    hireType, setHireType, accDate, setAccDate, accStreet, setAccStreet,
    accSuburb, setAccSuburb, accDescription, setAccDescription,
    tpFirstName, setTpFirstName, tpLastName, setTpLastName,
    tpPhone, setTpPhone, tpEmail, setTpEmail,
    tpAddress, setTpAddress, tpSuburb, setTpSuburb, tpPostal, setTpPostal, tpState, setTpState,
    tpVehRego, setTpVehRego, tpVehMake, setTpVehMake, tpVehModel, setTpVehModel, tpVehYear, setTpVehYear,
    tpInsCarrier, setTpInsCarrier, tpClaimNo, setTpClaimNo,
    roFirstName, setRoFirstName, roLastName, setRoLastName, roMi, setRoMi,
    roDob, setRoDob, roMobile, setRoMobile, roHomePhone, setRoHomePhone,
    roWorkPhone, setRoWorkPhone, roEmail, setRoEmail, roAltId, setRoAltId,
    roStreet1, setRoStreet1, roStreet2, setRoStreet2, roCity, setRoCity,
    roState, setRoState, roPostal, setRoPostal, roCountry, setRoCountry,
    roLicNum, setRoLicNum, roLicState, setRoLicState, roLicExpires, setRoLicExpires,
    authorityToAct, setAuthorityToAct, rentalAgreement, setRentalAgreement,
    assignedRego, setAssignedRego, assignedVehicleId, setAssignedVehicleId,
    pickupLoc, setPickupLoc, dropLoc, setDropLoc,
    ratePlanType, setRatePlanType, rateCode, setRateCode, rateClass, setRateClass,
    estKms, setEstKms, availUnits, setAvailUnits, unit, setUnit, unitDesc, setUnitDesc,
    nafRego, setNafRego, nafYear, setNafYear, nafMake, setNafMake, nafModel, setNafModel, nafBodyType, setNafBodyType,
    nafInsCarrier, setNafInsCarrier, nafInsPolicy, setNafInsPolicy, nafInsPhone, setNafInsPhone,
    nafInsAgent, setNafInsAgent, nafInsAgency, setNafInsAgency, nafCoverType, setNafCoverType,
    rezNumber, fileNumber, reservationId, isSaving, saveError, saveSuccess, save,
    reservationStatus, putOnHire, puttingOnHire, onHireError,
    uploadDocument, removeDocument, uploadingAuthorityToAct, uploadingRentalAgreement, docError,
  };

  return <RezFormContext.Provider value={formCtx}>{children}</RezFormContext.Provider>;
}
