document.addEventListener('DOMContentLoaded', function(){
    let possibleRegistrationColumns = ['application', 'applicationHref', 'clientIP', 'clientToken', 'time'];
    let testRegistrations = [
        {application: 'testapp', applicationHref: 'prot-subuntu:8080/wiki?page=test', clientIP: '201.100.90.12', clientToken: '12311214513521431231232019310239', time: '2019-12-20T05:30:10.011Z'},
        {application: 'testapp', applicationHref: 'prot-subuntu:8080/wiki?page=sage', clientIP: '201.100.90.12', clientToken: '12311214513521431231232019310239', time: '2019-13-20T05:30:10.011Z'},
        {application: 'testapp', applicationHref: 'prot-subuntu:8080/wiki?page=aplication', clientIP: '201.100.90.12', clientToken: '12311214513521431231232019310239', time: '2019-14-20T05:30:10.011Z'},
        {application: 'testapp', applicationHref: 'prot-subuntu:8080/wiki?page=fa%20übersicht', clientIP: '201.100.90.12', clientToken: '12311214513521431231232019310239', time: '2019-15-20T05:30:10.011Z'},
    ];

    let gridContainer = document.querySelector('div.layout-container');
    
    gridContainer.setAttribute('style', `--column-count: ${possibleRegistrationColumns.length};`);

    function createCell(text, className){
        let cell = document.createElement('div');
        cell.innerText = text;
        cell.className = className;
        return cell;
    }
    
    for(columnName of possibleRegistrationColumns){
        gridContainer.append(createCell(columnName, 'column-cell registration-cell'));
    }
    
    for(registration of testRegistrations){
        for(key of possibleRegistrationColumns){
            gridContainer.append(createCell(registration[key], 'data-cell registration-cell'));
        }
    }
});
