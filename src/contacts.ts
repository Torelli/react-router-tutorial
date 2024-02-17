import localforage from "localforage";
import { matchSorter } from "match-sorter";
import { sortBy } from "sort-by-typescript";


export type ContactType = {
  id: string;
  first: string;
  last: string;
  avatar: string;
  twitter: string;
  notes: string;
  favorite: boolean;
};

export async function getContacts(query: string | null = null) {
  await fakeNetwork(`getContacts:${query}`);
  let contacts: ContactType[] | null = await localforage.getItem("contacts");
  if (!contacts) contacts = [];
  if (query) {
    contacts = matchSorter(contacts, query, { keys: ["first", "last"] });
  }
  return contacts.sort(sortBy("last", "createdAt"));
}

export async function createContact() {
  await fakeNetwork();
  const id = Math.random().toString(36).substring(2, 9);
  const contact = { id, createdAt: Date.now() };
  const contacts = await getContacts();
  contacts.unshift(contact);
  await set(contacts);
  return contact;
}

export async function getContact(id: string) {
  await fakeNetwork(`contact:${id}`);
  const contacts: ContactType[] | null = await localforage.getItem("contacts");
  const contact =
    contacts != null && contacts.find((contact) => contact.id === id);
  return contact ?? null;
}

export async function updateContact(id: string, updates: ContactType) {
  await fakeNetwork();
  const contacts: ContactType[] | null = await localforage.getItem("contacts");
  const contact =
    contacts != null && contacts.find((contact) => contact.id === id);
  if (!contact) throw new Error(`No contact found for ${id}`);
  Object.assign(contact, updates);
  await set(contacts);
  return contact;
}

export async function deleteContact(id: string) {
  const contacts: ContactType[] | null = await localforage.getItem("contacts");
  const index =
    contacts != null ? contacts.findIndex((contact) => contact.id === id) : -1;
  if (index > -1) {
    (contacts as ContactType[]).splice(index, 1);
    await set(contacts as ContactType[]);
    return true;
  }
  return false;
}

function set(contacts: ContactType[]) {
  return localforage.setItem("contacts", contacts);
}

// fake a cache so we don't slow down stuff we've already seen
let fakeCache = {};

async function fakeNetwork(key: string | null = null) {
  if (!key) {
    fakeCache = {};
  }

  if (fakeCache[key]) {
    return;
  }

  fakeCache[key] = true;
  return new Promise((res) => {
    setTimeout(res, Math.random() * 800);
  });
}
