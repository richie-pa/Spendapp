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

  private getHeaders(): HeadersInit {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      "OCS-APIRequest": "true",
    };
  }

  async getProject(): Promise<Project> {
    const response = await fetch(this.getBaseUrl(), {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get project: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.ocs?.data || data;
  }

  async getMembers(): Promise<Member[]> {
    const response = await fetch(`${this.getBaseUrl()}/members`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get members: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.ocs?.data || data;
  }

  async getBills(): Promise<Bill[]> {
    const response = await fetch(`${this.getBaseUrl()}/bills`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get bills: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.ocs?.data || data;
  }

  async getStatistics(): Promise<Statistics> {
    const response = await fetch(`${this.getBaseUrl()}/statistics`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Failed to get statistics: ${response.status} - ${error}`
      );
    }

    const data = await response.json();
    return data.ocs?.data || data;
  }

  async getSettlement(): Promise<Settlement> {
    const response = await fetch(`${this.getBaseUrl()}/settlement`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Failed to get settlement: ${response.status} - ${error}`
      );
    }

    const data = await response.json();
    return data.ocs?.data || data;
  }

  async createBill(payload: CreateBillPayload): Promise<Bill> {
    const response = await fetch(`${this.getBaseUrl()}/bills`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create bill: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.ocs?.data || data;
  }

  async deleteBill(billId: number): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/bills/${billId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete bill: ${response.status} - ${error}`);
    }
  }

  static parseCospendLink(link: string): CospendLink {
    // Handle cospend://host/token/password format
    const match = link.match(/^cospend:\/\/([^/]+)\/([^/]+)\/([^/]+)$/);

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
