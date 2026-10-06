import type {
  ManagedRole,
  ParentDto,
  ParentRelationship,
} from "@/types/account";

/**
 * Tipe & konstanta untuk form akun orang tua.
 *
 * Dipisah ke modul ini supaya `ParentFormModal` (tampilan) dan `orang-tua`
 * (orchestrator state) bisa berbagi definisi tanpa impor melingkar.
 */

export interface FormStudent {
  /** Ada bila anak sudah tersimpan (mode ubah); kosong = anak baru. */
  id?: number;
  name: string;
  className: string;
}

export interface ParentForm {
  username: string;
  password: string;
  parentName: string;
  relationship: ParentRelationship;
  /** Satu orang tua boleh punya lebih dari satu anak. */
  students: FormStudent[];
  /** `parent` biasa, atau `korlas` (koordinator kelas). */
  role: ManagedRole;
  /** Kelas yang dikoordinasi — hanya dipakai bila role `korlas`. */
  className: string;
  phone: string;
  email: string;
}

export const RELATIONSHIP_OPTIONS: { value: ParentRelationship; label: string }[] = [
  { value: "ibu", label: "Ibu" },
  { value: "ayah", label: "Ayah" },
  { value: "wali", label: "Wali" },
];

export const ROLE_OPTIONS: { value: ManagedRole; label: string }[] = [
  { value: "parent", label: "Orang tua" },
  { value: "korlas", label: "Korlas (koordinator kelas)" },
];

export const EMPTY_STUDENT: FormStudent = { name: "", className: "" };

export const EMPTY_FORM: ParentForm = {
  username: "",
  password: "",
  parentName: "",
  relationship: "ibu",
  students: [{ ...EMPTY_STUDENT }],
  role: "parent",
  className: "",
  phone: "",
  email: "",
};

/** Susun `ParentForm` dari DTO saat mengubah akun yang sudah ada. */
export function formFromParent(parent: ParentDto): ParentForm {
  return {
    username: parent.username,
    password: "",
    parentName: parent.parentName,
    relationship: parent.relationship,
    role: parent.role,
    className: parent.className ?? "",
    students:
      parent.students.length > 0
        ? parent.students.map((student) => ({
            id: student.id,
            name: student.name,
            className: student.className ?? "",
          }))
        : [{ ...EMPTY_STUDENT }],
    phone: parent.phone ?? "",
    email: parent.email ?? "",
  };
}
