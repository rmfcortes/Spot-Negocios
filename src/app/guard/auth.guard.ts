import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { RegionService } from '../services/region.service';
import { CuentaService } from '../services/cuenta.service';
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private authService: AuthService,
    private regionService: RegionService,
    private planService: CuentaService,
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      return this.authService.checkUser()
      .then(uid => {
        if (!uid) { 
          this.router.navigate(['/login'])
          throw 'no_uid'
        }
        return this.regionService.checkRegion()
      })
      .then(() => this.planService.checkPlan())
      .then(() => true)
      .catch(() => false)
  }

}
