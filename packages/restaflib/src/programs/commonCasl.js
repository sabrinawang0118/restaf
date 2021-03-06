/*
* Copyright © 2019, SAS Institute Inc., Cary, NC, USA.  All Rights Reserved.
* SPDX-License-Identifier: Apache-2.0
*/


function commonCasl (){
    let casl = `
 
    /*-----------------------------------------*/ 
    /* isModel: is it model table              */  
    /*-----------------------------------------*/  
 
    function isModel(caslib, name) ; 
         table.columnInfo r = result /  
                table = {caslib=caslib , name=name};  
         validTable = false; 
         mtype = 'bad'; 
         do c over result.columninfo;  
            cu = upCase(c.Column); 
            if ( cu eq 'DATASTEPSRC') then do; 
               mtype = 'ds'; 
            end; 
            else if ( cu eq '_STATE_' ) then do; 
              mtype = 'astore'; 
            end; 
            else if (cu eq 'MODELMETADATA') then do; 
              mtype = 'ds2'; 
            end; 
        end;  
        print 'Specified model type: ' || mtype; 
        return mtype; 
    end; 
 
    /*-----------------------------------------*/ 
    /* Returns contents of the specified table */  
    /*-----------------------------------------*/  
 
    function contents(caslib, name) ;    
        table.columnInfo r = result /  
                table = {caslib=caslib , name=name};  
       /* columns ={{Column='_Index_',ID=0,Type='double',RawLength=5,FormattedLength=5,NFL=0,NFD=0}}; */ 
        i = 1;  
        columns = {}; 
        do c over result.columninfo;  
            columns[i] = c;  
            i = i + 1;  
        end;  
        return {describe = columns, table = {}};   
    end;  
         
    /*------------------------------------------*/  
    /* Returns unique values                   */  
    /*-----------------------------------------*/  
 
    function selectionLists(idvars,caslib, name);   
         
        s = checkAndLoadTable(caslib, name);   
        if ( s ne 0 ) then do;   
        results = {Errors= 'Unable to access ' ||caslib||'.'||name};   
        return results;   
        end;   
         
        do k over idvars;   
        r  = _getValues(k, caslib, name);   
        results[k] = r;   
        end;   
             
        return results;       
    end;   
         
    function _getValues(id, caslib, name) ;   
                     
        action table.dropTable/   
        caslib='casuser' name='dtemp1' quiet=TRUE;   
             
        action table.deleteSource status=src /   
        caslib='casuser' source= 'dtemp1.sashdat' quiet=TRUE;   
             
        action simple.groupby result=r status=rc/   
            aggregator = 'N'   
            inputs     = {id}   
            table      = {caslib=caslib name=name}   
            casout     = {caslib='casuser' name='dtemp1'}   
        ;   
        action table.fetch result=r/   
            table={caslib='casuser' name='dtemp1'}    
            sortby={{name=id,  order='ascending'}};   
        result = r.Fetch[,2];   
        return result;   
        end;   
 
    /*------------------------------------------*/ 
    /* get a record                             */ 
    /*------------------------------------------*/ 
 
    function _fetchData(filter, table); 
        s = checkAndLoadTable(table.caslib, table.name);   
        if ( s ne 0 ) then do;   
            results = {Errors= 'Unable to access ' ||table.caslib||'.'||table.name};   
            return results;   
            end;   
        wherex = dictTowhere(filter);   
       /* wherex = table.caslib||'.'||table.name||'(where=('||wherex||'));';  
         
        destroyTable('casuser', 'input');  
 
        action datastep.runCode r=result status=rc/   
            single='yes'   
            code = 'data casuser.input; set ' || wherex||'run;';  
            */ 
             
        action table.fetch r = result /   
            table={caslib=table.caslib name=table.name where=wherex};   
     
        rows = resultsToDict(result.Fetch);   
        return {scenario = rows, table = result.Fetch};   
 
    end; 

    function destroyTable(caslib,name);   
        action table.dropTable/   
        caslib=caslib name=name quiet=TRUE;   
                 
        action table.deleteSource status=src /   
        caslib=caslib source= name||'.sashdat' quiet=TRUE;   
             
    return true;   
    end;   
         
    function checkAndLoadTable(caslib, name);   
                     
        /*    
        * Verify that the table is loaded   
        */   
        action table.tableExists r=result/    
            caslib = caslib    
            name  = name;    
             
        /*   
        * if necessary load the table   
        */   
       

        if ( result.exists eq 0) then do;   
            path = lookupPath(caslib, name);
            if (path eq '*') then do;
               return 1;
            end;
            action table.loadTable status=status/    
                caslib = caslib    
                source = path /*upcase(name) || '.sashdat' */   
                casout={caslib= caslib name=name};    
            return status.statusCode;   
        end;    
        else do;   
            print name '  preloaded';   
            return 0;   
        end;   
    end;   
         
    function dictToWhere(filter);   
        where ='';   
        andbit='  ';   
        do k,v over filter;   
            if (isString(v) ) then do;   
                where = where || andbit || k ||  ' eq ' || '"'||v||'"';   
            end;    
            else do;   
                where = where || andbit || k ||  ' eq ' || v ;   
            end;   
        andbit =' and ';   
        end;   
    return where;   
    end;   
         
    function resultsToDict(r);   
        casResults = {};   
        i = 1;   
        do row over r;   
        casResults[i] = row;   
        i = i + 1;   
        end;   
        return casResults;   
    end;   
     
    function argsToTable(_arg_, caslib, name );   
        action table.droptable/  
            caslib=caslib name=name quiet=TRUE;  
        i = 1;  
        do key,obj over _arg_;  
            columns[i] = key;  
            row[i] = obj;  
            if ( isString(obj) ) then  
                type[i] = 'varchar';   
            else if ( isInteger(obj) ) then   
                type[i] = 'int';   
            else type[i] = 'double';  
            i = i + 1;  
            end;    
         
        data1 = newTable('data1', columns, type, row );   
         
        saveresult data1 casout=name caslib=caslib replace;   
    end;   

    function lookupPath(caslib, name ) ; 
        table.fileInfo r = result/ 
        caslib=caslib; 
    
        names = result.fileInfo[,4]; 

        nameu = upcase(name)||'.SASHDAT'; 
        cpath = '*'; 
        
        count = 0; 
        do n over names; 
        if (upcase(n) eq nameu)  then do; 
            count = count + 1; 
            if ( cpath eq '*') then do; 
                cpath = n; 
            end; 
        end; 
        end; 
        
        if (count eq 0 ) then do; 
        print {Error: Table not found}; 
        r = '*'; 
        end; 
        else do; 
        if (count > 1 ) then do; 
            print 'Warning: ' count 'Files with names only different in case exist - First one chosen'; 
        end; 
        print 'Path: ' cpath ' will be used****'; 
        r = cpath; 
        end; 
    return r; 
end; 
     `
     ;
return casl;
}
export default commonCasl;