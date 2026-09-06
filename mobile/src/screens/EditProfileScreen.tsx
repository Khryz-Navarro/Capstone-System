import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { updateProfile } from '../services/api';
import { useTheme } from '../theme/ThemeContext';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

const CIVIL_STATUS_OPTIONS = [
  { label: 'Single', value: 'single' },
  { label: 'Married', value: 'married' },
  { label: 'Widowed', value: 'widowed' },
  { label: 'Separated', value: 'separated' },
  { label: 'Divorced', value: 'divorced' },
];

interface EditProfileScreenProps {
  /** The full user object as returned by getProfile() — must include resident_profile. */
  profile: any;
  onCancel: () => void;
  onSaved: (updatedProfile: any) => void;
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      {children}
    </View>
  );
}

function TextField({
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'numbers-and-punctuation';
}) {
  const { colors } = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType={keyboardType}
      style={[
        styles.input,
        { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
      ]}
    />
  );
}

function OptionPicker({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.optionRow}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.optionBtn,
              { borderColor: colors.border, backgroundColor: colors.inputBg },
              isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.optionText, { color: isActive ? '#041720' : colors.text }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.toggleOptions}>
        <Pressable
          style={[
            styles.toggleBtn,
            { borderColor: colors.border },
            !value && { backgroundColor: colors.inputBg },
            value && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => onChange(true)}
        >
          <Text style={[styles.toggleBtnText, { color: value ? '#041720' : colors.textMuted }]}>YES</Text>
        </Pressable>
        <Pressable
          style={[
            styles.toggleBtn,
            { borderColor: colors.border },
            !value && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => onChange(false)}
        >
          <Text style={[styles.toggleBtnText, { color: !value ? '#041720' : colors.textMuted }]}>NO</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.primary }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function EditProfileScreen({ profile, onCancel, onSaved }: EditProfileScreenProps) {
  const { colors } = useTheme();
  const rp = profile?.resident_profile ?? {};

  const [firstName, setFirstName] = useState(rp.first_name ?? '');
  const [middleName, setMiddleName] = useState(rp.middle_name ?? '');
  const [lastName, setLastName] = useState(rp.last_name ?? '');
  const [suffix, setSuffix] = useState(rp.suffix ?? '');
  const [gender, setGender] = useState(rp.gender ?? 'male');
  const [civilStatus, setCivilStatus] = useState(rp.civil_status ?? 'single');
  const [birthdate, setBirthdate] = useState(rp.birthdate ?? '');
  const [occupation, setOccupation] = useState(rp.occupation ?? '');
  const [mobileNumber, setMobileNumber] = useState(rp.mobile_number ?? '');

  const [houseNumber, setHouseNumber] = useState(rp.address?.house_number ?? '');
  const [street, setStreet] = useState(rp.address?.street ?? '');
  const [purok, setPurok] = useState(rp.address?.purok ?? '');
  const [sitio, setSitio] = useState(rp.address?.sitio ?? '');
  const [city, setCity] = useState(rp.address?.city ?? '');
  const [province, setProvince] = useState(rp.address?.province ?? '');

  const [lengthOfStay, setLengthOfStay] = useState(rp.length_of_stay ?? '');
  const [householdRole, setHouseholdRole] = useState(rp.household_role ?? '');

  const [educationalAttainment, setEducationalAttainment] = useState(rp.educational_attainment ?? '');
  const [estimatedMonthlyIncome, setEstimatedMonthlyIncome] = useState(
    rp.estimated_monthly_income != null ? String(rp.estimated_monthly_income) : '',
  );
  const [philsysId, setPhilsysId] = useState(rp.philsys_id ?? '');
  const [comelecVoterStatus, setComelecVoterStatus] = useState(rp.comelec_voter_status ?? '');

  const ss = rp.social_sector ?? {};
  const [isSeniorCitizen, setIsSeniorCitizen] = useState(Boolean(ss.is_senior_citizen));
  const [isPwd, setIsPwd] = useState(Boolean(ss.is_pwd));
  const [is4psBeneficiary, setIs4psBeneficiary] = useState(Boolean(ss.is_4ps_beneficiary));
  const [isSoloParent, setIsSoloParent] = useState(Boolean(ss.is_solo_parent));
  const [isIndigentHousehold, setIsIndigentHousehold] = useState(Boolean(ss.is_indigent_household));
  const [isOutOfSchoolYouth, setIsOutOfSchoolYouth] = useState(Boolean(ss.is_out_of_school_youth));
  const [isIpTribeResident, setIsIpTribeResident] = useState(Boolean(ss.is_ip_tribe_resident));

  const [idVerificationType, setIdVerificationType] = useState(rp.id_verification_type ?? '');
  const [idDocumentNumber, setIdDocumentNumber] = useState(rp.id_document_number ?? '');

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!firstName || !lastName || !mobileNumber || !city || !province || !birthdate) {
      Alert.alert('Missing details', 'Please complete all required fields (marked with *).');
      return;
    }

    const payload: Record<string, unknown> = {
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName,
      suffix: suffix || null,
      gender,
      birthdate,
      civil_status: civilStatus,
      occupation: occupation || null,
      mobile_number: mobileNumber,

      house_number: houseNumber || null,
      street: street || null,
      purok: purok || null,
      sitio: sitio || null,
      city,
      province,

      length_of_stay: lengthOfStay || null,
      household_role: householdRole || null,

      educational_attainment: educationalAttainment || null,
      estimated_monthly_income: estimatedMonthlyIncome ? Number(estimatedMonthlyIncome) : null,
      philsys_id: philsysId || null,
      comelec_voter_status: comelecVoterStatus || null,

      is_senior_citizen: isSeniorCitizen,
      is_pwd: isPwd,
      is_4ps_beneficiary: is4psBeneficiary,
      is_solo_parent: isSoloParent,
      is_indigent_household: isIndigentHousehold,
      is_out_of_school_youth: isOutOfSchoolYouth,
      is_ip_tribe_resident: isIpTribeResident,

      id_verification_type: idVerificationType || null,
      id_document_number: idDocumentNumber || null,
    };

    setSaving(true);
    try {
      const updated = await updateProfile(payload);
      onSaved(updated);
    } catch (error: any) {
      const errors = error?.response?.data?.errors as Record<string, string[]> | undefined;
      const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
      const msg =
        firstError ??
        error?.response?.data?.message ??
        'Unable to save your changes. Please try again.';
      Alert.alert('Update failed', msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <Pressable onPress={onCancel} hitSlop={12}>
          <Text style={[styles.headerCancel, { color: colors.textMuted }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.headerSave, { color: colors.primary }]}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SectionCard title="PERSONAL & DEMOGRAPHIC">
          <FieldGroup label="First Name *">
            <TextField value={firstName} onChangeText={setFirstName} placeholder="e.g. Juan" />
          </FieldGroup>
          <FieldGroup label="Middle Name">
            <TextField value={middleName} onChangeText={setMiddleName} placeholder="e.g. Santos" />
          </FieldGroup>
          <FieldGroup label="Last Name *">
            <TextField value={lastName} onChangeText={setLastName} placeholder="e.g. Dela Cruz" />
          </FieldGroup>
          <FieldGroup label="Suffix">
            <TextField value={suffix} onChangeText={setSuffix} placeholder="e.g. Jr." />
          </FieldGroup>
          <FieldGroup label="Birth Date * (YYYY-MM-DD)">
            <TextField
              value={birthdate}
              onChangeText={setBirthdate}
              placeholder="1998-10-12"
              keyboardType="numbers-and-punctuation"
            />
          </FieldGroup>
          <FieldGroup label="Gender">
            <OptionPicker value={gender} options={GENDER_OPTIONS} onChange={setGender} />
          </FieldGroup>
          <FieldGroup label="Civil Status">
            <OptionPicker value={civilStatus} options={CIVIL_STATUS_OPTIONS} onChange={setCivilStatus} />
          </FieldGroup>
        </SectionCard>

        <SectionCard title="CONTACT & ADDRESS">
          <FieldGroup label="Mobile Number *">
            <TextField value={mobileNumber} onChangeText={setMobileNumber} keyboardType="phone-pad" />
          </FieldGroup>
          <FieldGroup label="House No.">
            <TextField value={houseNumber} onChangeText={setHouseNumber} />
          </FieldGroup>
          <FieldGroup label="Street">
            <TextField value={street} onChangeText={setStreet} />
          </FieldGroup>
          <FieldGroup label="Purok / Zone">
            <TextField value={purok} onChangeText={setPurok} />
          </FieldGroup>
          <FieldGroup label="Sitio">
            <TextField value={sitio} onChangeText={setSitio} />
          </FieldGroup>
          <FieldGroup label="City *">
            <TextField value={city} onChangeText={setCity} />
          </FieldGroup>
          <FieldGroup label="Province *">
            <TextField value={province} onChangeText={setProvince} />
          </FieldGroup>
          <FieldGroup label="Length of Stay">
            <TextField value={lengthOfStay} onChangeText={setLengthOfStay} placeholder="e.g. 12 Years" />
          </FieldGroup>
          <FieldGroup label="Household Role">
            <TextField value={householdRole} onChangeText={setHouseholdRole} placeholder="e.g. Head of Family" />
          </FieldGroup>
        </SectionCard>

        <SectionCard title="EDUCATION & LIVELIHOOD">
          <FieldGroup label="Educational Attainment">
            <TextField value={educationalAttainment} onChangeText={setEducationalAttainment} placeholder="e.g. College Graduate" />
          </FieldGroup>
          <FieldGroup label="Occupation">
            <TextField value={occupation} onChangeText={setOccupation} placeholder="e.g. Self-Employed / Merchant" />
          </FieldGroup>
          <FieldGroup label="Estimated Monthly Income (₱)">
            <TextField value={estimatedMonthlyIncome} onChangeText={setEstimatedMonthlyIncome} keyboardType="numeric" />
          </FieldGroup>
          <FieldGroup label="PhilSys ID">
            <TextField value={philsysId} onChangeText={setPhilsysId} />
          </FieldGroup>
          <FieldGroup label="COMELEC Voter Status">
            <TextField value={comelecVoterStatus} onChangeText={setComelecVoterStatus} placeholder="e.g. Registered Voter (Poblacion)" />
          </FieldGroup>
        </SectionCard>

        <SectionCard title="SOCIAL SECTOR & DEMOGRAPHICS">
          <ToggleRow label="Senior Citizen" value={isSeniorCitizen} onChange={setIsSeniorCitizen} />
          <ToggleRow label="PWD (Disabled)" value={isPwd} onChange={setIsPwd} />
          <ToggleRow label="4Ps/DCT Beneficiary" value={is4psBeneficiary} onChange={setIs4psBeneficiary} />
          <ToggleRow label="Solo Parent" value={isSoloParent} onChange={setIsSoloParent} />
          <ToggleRow label="Indigent Household" value={isIndigentHousehold} onChange={setIsIndigentHousehold} />
          <ToggleRow label="Out of School Youth" value={isOutOfSchoolYouth} onChange={setIsOutOfSchoolYouth} />
          <ToggleRow label="IP Tribe Resident" value={isIpTribeResident} onChange={setIsIpTribeResident} />
        </SectionCard>

        <SectionCard title="ID VERIFICATION">
          <FieldGroup label="ID Verification Type">
            <TextField value={idVerificationType} onChangeText={setIdVerificationType} placeholder="e.g. Postal ID" />
          </FieldGroup>
          <FieldGroup label="ID Document Number">
            <TextField value={idDocumentNumber} onChangeText={setIdDocumentNumber} />
          </FieldGroup>
          <Text style={[styles.noteText, { color: colors.textMuted }]}>
            To replace your uploaded ID scan, please visit your barangay office.
          </Text>
        </SectionCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerCancel: { fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerSave: { fontSize: 14, fontWeight: '800' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  optionText: { fontSize: 12, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 13, flex: 1 },
  toggleOptions: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleBtnText: { fontSize: 11, fontWeight: '800' },
  noteText: { fontSize: 11, lineHeight: 16, marginTop: 4 },
});