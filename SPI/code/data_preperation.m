d= dir('G:\My Drive\INResearch\#DATA\ERA5_1979_2022/*.txt');
path= 'G:\My Drive\INResearch\#DATA\ERA5_1979_2022/';
out=[];
for i=1:7732
    disp(i);
    nm= d(i).name;
    data = dlmread([path, nm]);
    data35 = data(1,35);
    out(i,[1:3]) = [str2num(nm(6:11)), str2num(nm(13:18)), data35];
end

nm = 'E_2022_GLEAM_v3.8a.nc';
ncdisp(nm)
lat = ncread(nm,'lat');
lon = ncread(nm,'lon');
E = ncread(nm,'E');

E=E([981:1124], [197:340],:);
lat=lat([197:340],1);
lat = flip(lat);
lon=lon([981:1124],1);

E150= E(:,:,150);
E150 = rot90(E150);


out=[];
n=1;
for i=1:144
    for j=1:144
        disp(n);
        out(n,[1:3]) = [lat(i,1), lon(j,1), E150(i,j)];
        n=n+1;
    end
end

geoscatter(out(:,1),out(:,2),[],out(:,3))


% Combine into a table
data_table = table(out(:,1), out(:,2), out(:,3), 'VariableNames', {'latitude', 'longitude', 'Value'});

% Save as CSV file
filename = 'E:\drought-monitoring-system\SPI\data.csv';
writetable(data_table, filename);
