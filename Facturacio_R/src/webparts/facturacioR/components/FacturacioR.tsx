import * as React from 'react';
import styles from './FacturacioR.module.scss';
import { IFacturacioRProps } from './IFacturacioRProps';
import { escape } from '@microsoft/sp-lodash-subset';
import { jsPDF } from "jspdf";
import 'jspdf-autotable'
import * as moment from 'moment';
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { DateTimePicker, DateConvention, TimeConvention } from '@pnp/spfx-controls-react/lib/dateTimePicker';
import { _Item } from '@pnp/sp/items/types';
export default class Factura extends React.Component<IFacturacioRProps, {table:any[],
  client:any, total:number,hores:number,preuHora:number,totalPH:number,date:any,
  facutura:boolean,productes:any[],treball:any,clients:any[]}> {
    public addIcon: string = require("../img/add.svg");
    public subIcon: string = require("../img/subb.svg");
    public logo:string= require("../img/Logo.jpg");
    public downloadIcon: string = require("../img/download.svg");

  constructor(props: any) {
    super(props);
    this.state = {
      table:[],
      client:"",
      total:0,
      hores:0,
      preuHora:0,
      totalPH:0,
      date:null,
      facutura:false,
      productes:[],
      clients:[],
      treball:""
    }
    this.handleChangeDate = this.handleChangeDate.bind(this);
  }
 componentDidMount(){
   sp.web.lists.getByTitle("Productes").items.getAll().then(productes=>{
     let _productes=[];
     productes.forEach(p=>{
       let producte={
        referencia:p.ref_x00e8_rencia,
        name:p.Title,
        price:p.preu,
       }
       _productes.push(producte);
      console.log(_productes);

     });
     this.setState({
      productes:_productes
     });
   });
   sp.web.lists.getByTitle("Clients").items.getAll().then(clients=>{
    let _clients=[];
    clients.forEach(c=>{
      var _client={
        nomClient:c.Title,
        adresa:c.Adre_x00e7_a,
        codiPostal:c.Codi_x0020_postal,
        NRT:c.NRT,
        IDClient:c.IDClient,
        telefon:c.Tel_x00e8_lfon,
        Email:c.Email,
        IBAN:c.IBAN,
        ID:c.ID
      }
      _clients.push(_client);
      console.log(_clients);
      this.setState({
        clients:_clients
      });
    });
   });
 }
  addRow(){
    var _table=this.state.table
    _table.push({
      camp1: 0,
      camp2: "",
      camp3:0,
      camp4:0,
      camp5:0
    });
     this.setState({
       table:_table
     });
  }
  subbRow(){
    let _table = this.state.table
    _table.pop();
    this.setState({
        table: _table
    });
  }
  handleInputChangeC1(event, index) {
    const target = event.target;
    const value = target.value;
    let _table = this.state.table;
    let item=this.state.productes.filter(i=>i.referencia==value)[0];
    _table[index].camp1 = item.referencia+"-"+item.name;
    _table[index].camp2="";
    _table[index].camp3=0;
    _table[index].camp4=item.price;
    this.setState({
        table: _table
    });
  };
  handleInputChangeC2(event, index) {
    const target = event.target;
    const value = target.value;
    let _table = this.state.table;
    _table[index].camp2 = value;
    this.setState({
        table: _table
    });
  };
  handleInputChangeC3(event, index) {
    const target = event.target;
    const value = target.value;
    let _table = this.state.table;
    _table[index].camp3 = value;
    _table[index].camp5=value*_table[index].camp4;
    let total=0;
    _table.forEach(item=>{
      total+=item.camp5
    });
    if(total!=0){
      total=total+this.state.totalPH;
    }
    this.setState({
        table: _table,
        total:total
    });
  };
  handleInputChangeHores(event) {
    const target = event.target;
    const value = target.value;
    this.setState({
      hores:value,
      totalPH:this.state.preuHora*value
    });
  };
  handleInputChangePreu(event) {
    const target = event.target;
    const value = target.value;
    this.setState({
      preuHora:value,
      totalPH:this.state.hores*value
    });
  };
  handleInputClient(event) {
    const target = event.target;
    const value = target.value;
    this.setState({
        client:value
    });
  };
  handleInputTreball(event) {
    const target = event.target;
    const value = target.value;
    this.setState({
        treball:value
    });
  };
  savePDF(){
    var col = ["Referència","Descripció manual","Unitats",
    "Prues unitaris","Import"];
    var date=moment(this.state.date).format("D/MM/YY")
    var rows = [];
    var items=this.state.table;
    var NRT=this.state.clients.filter(i=>i.nomClient==this.state.client)[0].NRT
    var client=this.state.client;
    client=client+"("+NRT+")";
    var total=this.state.total;
    var totalIGI=total+(total*0.045);
    var hores=this.state.hores;
    var treball=this.state.treball;
    var pHora=this.state.preuHora;
    for(let i=0;i<items.length;i++){
      var temp=[items[i].camp1,items[i].camp2,items[i].camp3,
      items[i].camp4,items[i].camp5];
      rows.push(temp);
    }
    let tipus="";
    if(this.state.facutura){
      tipus="Factura"
    }else{
      tipus="Pressupost"
    }
    var pdf:any = new jsPDF();
    let name=tipus+"-"+client;
    pdf.addImage(this.logo,"JPEG",5,15,80,40);
    pdf.setFontSize(10);
    pdf.text(95,25,"Client (NRT): "+client);
    pdf.text(95,35,tipus);
    pdf.text(95,45,"Data emisió: "+date);
    pdf.text(95,55,"Treball a efectuar: "+treball);
    pdf.text(95,65,"Hores(preu): "+hores+"("+pHora+")");
    pdf.text(95,75,"Total: "+total.toString());
    pdf.text(95,85,"Total(IGI):"+totalIGI.toString());
    pdf.autoTable(col, rows, {
      headerStyles:{
        fillColor:[183, 188, 207],
      },
      beforePageContent: function(data) {
      },
      startY:105,
      startX:5
    });
    pdf.save(name+".pdf");
  }

  handleChangeDate(e){
    this.setState({
      date:e
    });
  }
  FacturaPresupost(){
    if(this.state.facutura){
      this.setState({
        facutura:false,
        table:[],
        client:"",
        date:null,
        hores:0,
        preuHora:0,
        total:0,
        totalPH:0
      });
    }else{
      this.setState({
        facutura:true,
        table:[],
        client:"",
        date:null,
        hores:0,
        preuHora:0,
        total:0,
        totalPH:0
      });
    }
  }
  public render(): React.ReactElement<IFacturacioRProps> {

    return (
      <div>
        <div>
        </div>
        <div id="pressupost">
              <div>
                <b>
                  <h3 className={styles.title}>
                    {!this.state.facutura?"Pressupost":"Factura"}
                  </h3>
                </b>
                <label>
                  <button onClick={()=>{this.FacturaPresupost()}}>
                    {!this.state.facutura?"Canviar a factura":"Canviar a pressupost"}
                  </button>
                </label>
                <div id="botons" className={styles.botons}>
                  <img src={this.addIcon} className={styles.icon} onClick={()=>this.addRow()}/>
                  <img src={this.subIcon} className={styles.icon} onClick={()=>this.subbRow()}/>
                  <img src={this.downloadIcon} className={styles.icon} onClick={()=>this.savePDF()}/>              
                </div>
              </div> 

              <div id="text">
              <div id="client" className={styles.client}>
               <span>Client:</span> 
                  <select onChange={(e)=>{this.handleInputClient(e)}}>
                      <option value="-">-</option>
                      {this.state.clients.map((item,i)=>{
                        return(
                          <option value={item.nomClient}>{item.nomClient}</option>
                        )
                      })}
                  </select>
                 {/* <input type="text" placeholder="Client" value={this.state.client}
                  onChange={(e)=>{this.handleInputClient(e)}}/> */}
                </div>
                <div id="data">
                   <DateTimePicker dateConvention={DateConvention.Date} value={this.state.date}
                    onChange={this.handleChangeDate} />
                </div>
                <div id="factura" className={styles.client} style={{marginTop:"10px"}}>
                  <span style={{marginRight:"1.2%"}}>Factura:</span> 
                  <input type="text" placeholder="Treball a efectuar" value={this.state.treball}
                  onChange={(e)=>{this.handleInputTreball(e)}}/>
                </div>
              </div>
              <div id="Hores" className={styles.taulahores}>
              <table>
                <tr>
                  <th>Hores</th>
                  <th>Preu hora</th>
                  <th>Preu per hora</th>
                </tr>
                <tr>
                  <td>
                    <input   
                    value={this.state.hores}
                    onChange={(e) => { this.handleInputChangeHores(e) }} type="number" />
                  </td>
                  <td>
                    <input 
                    value={this.state.preuHora}
                    onChange={(e) => { this.handleInputChangePreu(e) }} 
                    type="number" />
                  </td>
                  <td>
                    <span>{this.state.totalPH}€</span>
                  </td>
                </tr>
              </table>  
              </div>
              <div id="taula" className={styles.taula}>
              <table>
                <tr>
                  <th>Referència</th>
                  <th>{!this.state.facutura?"Descripció manual":"Descripció material"}</th>
                  <th>Unitats</th>
                  <th>Prues unitaris</th>
                  <th>Import</th>
                </tr>
                {this.state.table.map((item,i)=>{
                  return(
                    <tr id={i.toString()}>
                        <td>
                          <select onChange={(e) => { this.handleInputChangeC1(e, i) }}>
                            <option value="-">-</option>
                            {this.state.productes.map((item)=>{
                              return(
                              <option value={item.referencia}>
                                  {item.name} - {item.referencia}
                              </option>)
                            })}
                          </select>
                        </td>
                        <td>
                          <input type="text" value={item.camp2} onChange={(e) => { this.handleInputChangeC2(e, i) }} />
                        </td>
                        <td>
                          <input type="number" value={item.camp3} onChange={(e) => { this.handleInputChangeC3(e, i) }} />
                        </td>
                        <td>
                          <span>{item.camp4}</span>
                        </td>
                        <td>
                          <span>{item.camp5}</span>                          
                        </td>
                    </tr>
                )
                })}
              </table>
              </div>

              <div id="total" className={styles.totals}>
                    <div>Total:   
                    <span style={{marginLeft:"6px"}}>{this.state.total}€</span>
               </div>
                <div>
                  Total IGI:
                  <span style={{marginLeft:"6px"}}>  {this.state.total+this.state.total*0.045}€</span>
                </div>
              </div>

                </div>
      
    </div>
    );
  }
}
