export class AuthResponseDto {
  id: string;
  name: string;
  token: string;

  constructor(id: string, name: string, token: string) {
    this.id = id;
    this.name = name;
    this.token = token;
  }
}
