function pag(options){
    if(!options) options = {};
    this.cur = options.cur || 10;//当前第几页
    this.space = options.space || 5; //一页共几个
    this.bordermax = options.bordermax || 3; //最多一共显示几页 * 左右各显示
    this.total = options.total || 100; //一共多少条数据
    this.size = Math.ceil(this.total / this.space);
    this.split = options.split || '/'; 
    this.url = (options.url || '/diary') + this.split;
    this.start = this.cur - this.bordermax >= 1 ? this.cur - this.bordermax : 1;
    this.end = this.cur + this.bordermax >= this.size ? this.size : this.cur + this.bordermax;
    //console.log(this.bordermax);
    //console.log(this.cur);
    //console.log(this.size);
    //console.log(this.end);
}

pag.prototype.draw = function(){
   var wrap = '<div class="pagination"><ul>';
   if(this.total === 0 || this.cur > this.size || this.cur <= 0 || this.size == 1) return '';
   if(this.cur!=1){
       wrap += '<li><a href="'+this.url+'1">首页</a></li>';
       wrap += '<li><a href="'+this.url+(this.cur-1)+'">前页</a></li>';
   }
   for(var i=this.start;i <= this.end;i++){
       var cls = this.cur == i ? ' class="active"' : '',
       item = '<li'+cls+'><a href="'+this.url+i+'">'+i+'</a></li>';
       wrap += item;
   }
   if(this.cur!=this.size){
       wrap += '<li><a href="'+this.url+(this.cur+1)+'">后页</a></li>';
       wrap += '<li><a href="'+this.url+this.size+'">尾页</a></li>';
   }
   wrap +='</ul></div>';
   return wrap;
};

pag.prototype.init = function(){
  return this.draw();  
};

exports.pag = pag;
