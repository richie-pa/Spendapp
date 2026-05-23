import { CapacitorHttp } from "@capacitor/core";

import type {
  CospendLink,
  Project,
  Member,
  Bill,
  Statistics,
  Settlement,
  CreateBillPayload,
} from "../types/cospend";

export class CospendApi {
  private link: CospendLink;

  constructor(link: CospendLink) {
    this.link = link;
  }

  private getBaseUrl(): string {
    const { host, token, password } = this.link;
    return `https://${host}/ocs/v2.php/apps/cospend/api/v1/public/projects/${token}/${password}`;
  }

  private getHeaders(): Record<string, string> {
    return {
      Accept: "application/json",
      "OCS-APIRequest": "true",
    };
  }

  async getProject(): Promise<Project> {
    const response = await CapacitorHttp.get({
      url: this.getBaseUrl(),
      headers: this.getHeaders(),
    });

    const data = response.data;
    const project = data.ocs?.data || data;

    return {
      ...project,
      members: Array.isArray(project.members)
        ? project.members
        : Object.values(project.members || {}),
      categories: Array.isArray(project.categories)
        ? project.categories
        : Object.values(project.categories || {}),
      paymentmodes: Array.isArray(project.paymentmodes)
        ? project.paymentmodes
        : Object.values(project.paymentmodes || {}),
    };
  }

  async getMembers(): Promise<Member[]> {
    const response = await CapacitorHttp.get({
      url: `${this.getBaseUrl()}/members`,
      headers: this.getHeaders(),
    });

    const data = response.data;
    return data.ocs?.data || data;
  }

  async getBills(): Promise<Bill[]> {
    const response = await CapacitorHttp.get({
      url: `${this.getBaseUrl()}/bills`,
      headers: this.getHeaders(),
    });

    const data = response.data;
    return data.ocs?.data?.bills || data.bills || [];
  }

  async getStatistics(): Promise<Statistics> {
    const response = await CapacitorHttp.get({
      url: `${this.getBaseUrl()}/statistics`,
      headers: this.getHeaders(),
    });

    const data = response.data;
    return data.ocs?.data || data;
  }

  async getSettlement(): Promise<Settlement> {
    const response = await CapacitorHttp.get({
      url: `${this.getBaseUrl()}/settlement`,
      headers: this.getHeaders(),
    });

    const data = response.data;
    return data.ocs?.data || data;
  }

  async createBill(payload: CreateBillPayload): Promise<Bill> {
    const response = await CapacitorHttp.post({
      url: `${this.getBaseUrl()}/bills`,
      headers: {
        ...this.getHeaders(),
        "Content-Type": "application/json",
      },
      data: payload,
    });

    const data = response.data;
    return data.ocs?.data || data;
  }

  async deleteBill(billId: number): Promise<void> {
    await CapacitorHttp.delete({
      url: `${this.getBaseUrl()}/bills/${billId}`,
      headers: this.getHeaders(),
    });
  }

  static parseCospendLink(link: string): CospendLink {
    const cleaned = link.trim().replace(/\s+/g, "");

    const match = cleaned.match(/^cospend:\/\/([^/]+)\/([^/]+)\/([^/]+)$/);

    if (!match) {
      throw new Error(
        "Invalid Cospend link format. Expected: cospend://host/token/password"
      );
    }

    return {
      host: match[1],
      token: match[2],
      password: match[3],
    };
  }

  static formatCospendLink(link: CospendLink): string {
    return `cospend://${link.host}/${link.token}/${link.password}`;
  }
}