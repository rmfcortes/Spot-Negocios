import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UidService {

  uid: string
  nombre: string
  plan: string
  region: string

  public usuario = new BehaviorSubject(null)
  public planWatch = new BehaviorSubject(null)

  constructor( ) {  }

  setUid(uid: string) {
    this.uid = uid
    this.usuario.next(uid)
  }

  getUid() {
    return this.uid
  }

  setNombre(nombre: string) {
    this.nombre = nombre
  }

  getNombre() {
    return this.nombre
  }

  setPlan(plan: string) {
    this.plan = plan
    this.planWatch.next(plan)
  }

  getPlan() {
    return this.plan
  }

  setRegion(region: string) {
    this.region = region
  }

  getRegion() {
    return this.region
  }

}
